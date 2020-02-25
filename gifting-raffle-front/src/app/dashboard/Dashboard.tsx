import React, { useState } from 'react';
import { Grid, Segment, Button, List, Image, Search, Select, DropdownProps } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { useLocale } from '../../shared/hooks';
import { FullscreenLoader } from '../../shared/components/fullscreenLoader/FullscreenLoader';

import { DashboardContainer, Empty, ListTitle, StyledColumn, StyledListHeader } from './Dashboard.styles';
import { DashboardPropsType } from './Dashboard.types';
import gift from 'assets/images/red_gift.svg';
import openGift from 'assets/images/gift_open.svg';
import crown from 'assets/images/crown.svg';

type State = {
  isLoading: boolean;
  results: any[];
  value: string;
};

export const Dashboard: React.FC<DashboardPropsType> = ({ rafflesList, loading, openDetails }) => {
  const { formatMessage } = useLocale();
  const [state, setState] = useState<State>({
    isLoading: false,
    results: [],
    value: '',
  });

  if (loading) {
    return <FullscreenLoader />;
  }

  const options = (rafflesList || []).map(el => ({
    value: el.id,
    text: el.name,
  }));

  const handleSelect = (_: any, { value }: DropdownProps) => {
    if (typeof value === 'string') {
      openDetails(value);
    }
  };

  const handleResultSelect = (e: any) => {
    openDetails(e);
  };

  const handleSearchChange = (e: any, { value }: any) => {
    setState(prevState => ({
      ...prevState,
      isLoading: true,
      value,
    }));

    setTimeout(() => {
      setState(prevState => ({
        ...prevState,
        results: (rafflesList || [])
          .filter(raffle => raffle.name.includes(value))
          .map(raffle => ({
            title: raffle.name,
            value: raffle.id,
          })),
        isLoading: false,
      }));
    }, 500);
  };

  return (
    <DashboardContainer className="dashboard-container">
      <Grid textAlign="center">
        <Grid.Column mobile={12} tablet={5} computer={4}>
          <Button as={Link} to="/raffle/join" size="big" fluid color="red">
            {formatMessage({ id: 'list.join' })}
          </Button>
        </Grid.Column>
        <Grid.Column mobile={12} tablet={5} computer={4}>
          <Button as={Link} to="/raffle/create" size="big" fluid color="yellow">
            {formatMessage({ id: 'list.create' })}
          </Button>
        </Grid.Column>
        <StyledColumn textAlign="left" verticalAlign="middle" mobile={16} tablet={12} computer={10}>
          <Segment padded raised piled>
            <ListTitle>TODO</ListTitle>
            <Grid textAlign="center">
              <Grid.Column mobile={12} tablet={12} computer={6}>
                <Select placeholder="Select..." options={options} onChange={handleSelect} />
              </Grid.Column>
              <Grid.Column mobile={12} tablet={12} computer={6}>
                <Search
                  loading={state.isLoading}
                  onResultSelect={handleResultSelect}
                  onSearchChange={handleSearchChange}
                  results={state.results}
                  value={state.value}
                  size="massive"
                />
              </Grid.Column>
            </Grid>
          </Segment>
          <Segment padded raised piled>
            <ListTitle>{formatMessage({ id: 'list.header' })}</ListTitle>
            <List animated size="massive" verticalAlign="middle">
              {rafflesList && rafflesList.length ? (
                rafflesList.map(item => (
                  <List.Item key={item.id} as={Link} to={`/raffle/${item.id}`}>
                    {item.finished ? <Image size="mini" src={openGift} /> : <Image size="mini" src={gift} />}
                    <List.Content>
                      <StyledListHeader>{item.name}</StyledListHeader>
                    </List.Content>
                    {item.isOwner ? <Image centered size="mini" src={crown} /> : null}
                  </List.Item>
                ))
              ) : (
                <Empty>{formatMessage({ id: 'list.empty' })}</Empty>
              )}
            </List>
          </Segment>
        </StyledColumn>
      </Grid>
    </DashboardContainer>
  );
};
