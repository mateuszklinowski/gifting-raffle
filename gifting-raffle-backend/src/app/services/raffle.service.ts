import { Repository } from "typeorm";
import { RaffleModel } from "../features/raffles/models/raffle.model";
import { PairModel } from "../features/raffles/models/pair.model";
import { HttpError } from "../../errors/http.error";
import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from "http-status-codes";
import { UserModel } from "../features/users/models/user.model";
import v4 = require("uuid/v4");

export interface RaffleServiceProps {
  rafflesRepository: Repository<RaffleModel>;
  pairsRepository: Repository<PairModel>;
}

export interface RafflesListData {
  id: string,
  name: string,
  isOwner: boolean,
  finished: boolean,
}

export interface MatchResult {
  leftReceivers: UserModel[],
  matchedPairs: PairModel[],
}

export interface JoinRaffleProps {
  name: string,
  raffleKey: string,
  user: UserModel,
}

export interface RaffleDetailsData {
  id: string,
  name: string,
  isOwner: boolean,
  finished: boolean,
  pairsCount: number,
  raffleKey?: string,
  yourMatch?: string,
}

export interface RaffleDetailsData {
  id: string,
  name: string,
  isOwner: boolean,
  finished: boolean,
  pairsCount: number,
}

export class RaffleService {
  private readonly rafflesRepository: Repository<RaffleModel>;

  private readonly pairsRepository: Repository<PairModel>;

  constructor({ rafflesRepository, pairsRepository }: RaffleServiceProps) {
    this.rafflesRepository = rafflesRepository;
    this.pairsRepository = pairsRepository;
  }

  async getRafflesList(userId: string): Promise<RafflesListData[]> {
    const list = await this.pairsRepository
                           .createQueryBuilder("pair")
                           .leftJoinAndSelect("pair.raffle", "raffle")
                           .where("pair.giverId=:userId", {
                             userId,
                           })
                           .orderBy("pair.order", "ASC")
                           .getMany();

    return list.map(item => {
      return {
        id: item.raffle.id,
        name: item.raffle.name,
        isOwner: item.raffle.ownerId === userId,
        finished: item.raffle.finished,
      };
    });
  }

  async createRaffle(name: string, user: UserModel): Promise<string> {
    const raffle = RaffleModel.create({
      finished: false,
      name,
      joinKey: this.generateKey(),
      owner: user,
      pairs: [
        PairModel.create({
          giver: user,
        }),
      ],
    });

    try {
      const { id } = await this.rafflesRepository.save(raffle);
      return id;
    } catch (e) {
      throw new HttpError("error.raffle.nameTaken", BAD_REQUEST);
    }
  }

  async joinRaffle({ user, raffleKey, name }: JoinRaffleProps): Promise<string> {
    const existingPair = await this.pairsRepository
                             .createQueryBuilder("pair")
                             .leftJoinAndSelect("pair.raffle", "raffle")
                             .where("pair.giverId=:userId AND raffle.name=:name", {
                               userId: user.id,
                               name,
                             })
                             .getCount();

    if(existingPair) {
      throw new HttpError("error.raffle.alreadyJoinedTo", FORBIDDEN);
    }

    const raffle = await this.rafflesRepository
                                   .createQueryBuilder("raffle")
                                   .where("raffle.name=:name", {
                                     name,
                                   })
                                   .getOne();

    if(!raffle || (raffle.joinKey !== raffleKey)) {
      throw new HttpError("error.raffle.notFound", NOT_FOUND);
    }

    if(raffle.finished) {
      throw new HttpError("error.raffle.alreadyFinished", BAD_REQUEST);
    }

    const newPair = PairModel.create({
      giver: user,
      raffle: raffle,
    });

    await this.pairsRepository.save(newPair);

    return raffle.id;
  }

  async endRaffle(raffleId: string, user: UserModel) {
    const raffle = await this.rafflesRepository
                             .createQueryBuilder("raffle")
                             .leftJoinAndSelect("raffle.pairs", "pairs")
                             .leftJoinAndSelect("pairs.giver", "giver")
                             .where("raffle.id=:raffleId AND raffle.ownerId=:userId", {
                               raffleId,
                               userId: user.id
                             })
                             .getOne();

    if(!raffle) {
      throw new HttpError("error.raffle.ownedNotFound", NOT_FOUND);
    }

    if(raffle.finished) {
      throw new HttpError("error.raffle.alreadyFinished", BAD_REQUEST);
    }

    if(raffle.pairs.length < 2) {
      throw new HttpError("error.raffle.canNotClose", BAD_REQUEST);
    }

    const pairs = raffle.pairs;
    const allGivers = raffle.pairs.map(pair => pair.giver);
    const {matchedPairs} = pairs.reduce((result: MatchResult, pair: PairModel): MatchResult => {
      const receivers = result.leftReceivers.filter(receiver => receiver.id !== pair.giver.id);

      const giverFilteredOut = receivers.length !== result.leftReceivers.length;

      const pick = this.pickRandomFromArray(receivers);

      const rest = result.leftReceivers.filter(receiver => receiver.id !== pick.id);
      pair.receiver = pick;

      return {
        leftReceivers: giverFilteredOut ? [...rest, pair.giver] : rest,
        matchedPairs: [...result.matchedPairs, pair],
      }
    }, {
      leftReceivers: allGivers,
      matchedPairs: [],
    });

    raffle.pairs = matchedPairs;
    raffle.finished = true;

    return this.rafflesRepository.save(raffle);
  }

  async getRafflesDetails(raffleId: string, userId: string): Promise<RaffleDetailsData> {
    const details = await this.pairsRepository
                              .createQueryBuilder("pair")
                              .leftJoinAndSelect("pair.raffle", "raffle")
                              .leftJoinAndSelect("pair.receiver", "receiver")
                              .leftJoinAndSelect("raffle.pairs", "raffle_pairs")
                              .where("pair.giverId=:userId AND pair.raffleId=:raffleId", {
                                userId,
                                raffleId,
                              })
                              .orderBy("pair.order", "ASC")
                              .getOne();

    if (!details) {
      throw new HttpError("error.raffle.notFound", NOT_FOUND);
    }

    const isOwner = details.raffle.ownerId === userId;

    return {
      id: details.raffle.id,
      name: details.raffle.name,
      isOwner,
      finished: details.raffle.finished,
      pairsCount: details.raffle.pairs.length,
      raffleKey: isOwner ? details.raffle.joinKey : undefined,
      yourMatch: details.raffle.finished ? details.receiver!.name : undefined
    };
  }

  private pickRandomFromArray<T>(input: T[]): T {
    return input[Math.abs(Math.ceil(Math.random() * input.length - 1))];
  }

  private generateKey(): string {
    return Buffer.from(v4()).toString("base64").slice(-10);
  }
}
