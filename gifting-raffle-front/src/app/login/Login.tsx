import React from 'react';
import { Button, Form as UiForm, Segment, Grid, Message } from 'semantic-ui-react';
import { Link, Redirect } from 'react-router-dom';
import { Field, Form } from 'react-final-form';

import { useAuthDispatch, useAuthState, useLocale } from '../../shared/hooks';
import { emailValidator, requireValidator } from '../../shared/validators';
import { LoginBody } from '../../api/actions/auth/authActions';
import { SET_TOKENS, START_AUTHORIZING } from '../../context/auth/authReducer/authReducer';
import { StyledGrid } from '../../shared/components/styledGrid/StyledGrid';
import { AbsoluteImage, AbsoluteImageContainerForm } from '../../shared/components/absoluteImage/AbsoluteImage';

import { ErrorText } from './Login.styles';
import { LoginProps } from './Login.types';
import dabSanta from 'assets/images/santa_dab.png';

export const Login: React.FC<LoginProps> = ({ onSubmit }) => {
  const { formatMessage } = useLocale();
  const { isAuthorized } = useAuthState();
  const dispatch = useAuthDispatch();

  const handleSubmit = async (body: LoginBody) => {
    const { payload, error } = await onSubmit(body);

    if (!error && payload) {
      dispatch({
        type: START_AUTHORIZING,
      });

      return dispatch({
        type: SET_TOKENS,
        accessToken: payload.accessToken,
      });
    }

    if (payload && payload.error) {
      return payload.error;
    }

    return {
      id: 'error.unknown',
    };
  };

  if (isAuthorized) {
    return <Redirect to="/" />;
  }

  return (
    <Form
      onSubmit={handleSubmit}
      render={({ handleSubmit, submitting, pristine, submitErrors, dirtySinceLastSubmit, errors }) => (
        <StyledGrid textAlign="center" verticalAlign="middle">
          <Grid.Column mobile={14} tablet={8} largeScreen={6} computer={6}>
            <AbsoluteImageContainerForm onSubmit={handleSubmit} size="large">
              <Segment raised piled>
                <Field name="email" validate={emailValidator}>
                  {({ input, meta }) => (
                    <UiForm.Input
                      fluid
                      error={meta.dirty && meta.error && formatMessage({ id: meta.error.id })}
                      input={input}
                      icon="mail"
                      iconPosition="left"
                      placeholder={formatMessage({ id: 'login.email' })}
                    />
                  )}
                </Field>
                <Field name="password" type="password" validate={requireValidator}>
                  {({ input, meta }) => (
                    <UiForm.Input
                      fluid
                      error={meta.dirty && meta.error && formatMessage({ id: meta.error.id })}
                      input={input}
                      icon="lock"
                      iconPosition="left"
                      placeholder={formatMessage({ id: 'login.password' })}
                      type="password"
                    />
                  )}
                </Field>
                {!submitting && submitErrors && submitErrors.id && !dirtySinceLastSubmit && (
                  <ErrorText>{formatMessage({ id: submitErrors.id })}</ErrorText>
                )}
                <Button type="submit" disabled={pristine || submitting} color="twitter" fluid size="large">
                  {formatMessage({ id: 'login.login' })}
                </Button>
              </Segment>
              <AbsoluteImage small centered size="small" src={dabSanta} />
            </AbsoluteImageContainerForm>
            <Message>
              {formatMessage({ id: 'login.new' })} <Link to="/sign-up">{formatMessage({ id: 'login.register' })}</Link>
            </Message>
          </Grid.Column>
        </StyledGrid>
      )}
    />
  );
};
