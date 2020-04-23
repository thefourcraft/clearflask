import { Box, Button, Container, IconButton, TextField } from '@material-ui/core';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import { History, Location } from 'history';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as Admin from '../api/admin';
import ServerAdmin, { ReduxStateAdmin } from '../api/serverAdmin';
import { saltHashPassword } from '../common/util/auth';

export const PRE_SELECTED_PLAN_ID = 'preSelectedPlanId';

const styles = (theme: Theme) => createStyles({
  page: {
    margin: theme.spacing(2),
  },
  item: {
    margin: theme.spacing(2),
  },
  link: {
    cursor: 'pointer',
    textDecoration: 'none!important',
    color: theme.palette.text.primary,
  },
  reviewRowError: {
    color: theme.palette.error.main,
  },
});

interface Props {
  history: History;
  location: Location;
}
interface ConnectProps {
  plans?: Admin.Plan[];
}
interface State {
  isSubmitting?: boolean;
  name?: string;
  email?: string;
  pass?: string;
  revealPassword?: boolean;
}

class SignupPage extends Component<Props & ConnectProps & WithStyles<typeof styles, true>, State> {
  state: State = {};

  render() {
    const canSubmit = !!this.state.name && !!this.state.email && !!this.state.pass;

    return (
      <div className={this.props.classes.page}>
        <Container maxWidth='md'>
          <Box display='flex' flexDirection='column' alignItems='flex-start'>
            <TextField
              className={this.props.classes.item}
              id='name'
              label='Name'
              required
              value={this.state.name || ''}
              onChange={e => this.setState({ name: e.target.value })}
            />
            <TextField
              className={this.props.classes.item}
              id='email'
              label='Work email'
              required
              value={this.state.email || ''}
              onChange={e => this.setState({ email: e.target.value })}
            />
            <Box display='flex' flexDirection='row' alignItems='center'>
              <TextField
                className={this.props.classes.item}
                id='pass'
                label='Password'
                required
                value={this.state.pass || ''}
                onChange={e => this.setState({ pass: e.target.value })}
                type={this.state.revealPassword ? 'text' : 'password'}
              />
              <IconButton
                aria-label='Toggle password visibility'
                onClick={() => this.setState({ revealPassword: !this.state.revealPassword })}
              >
                {this.state.revealPassword ? <VisibilityIcon fontSize='small' /> : <VisibilityOffIcon fontSize='small' />}
              </IconButton>
            </Box>
          </Box>
          <Box display='flex' className={this.props.classes.item}>
            <Button onClick={() => this.signUp()}
              color='primary'
              disabled={this.state.isSubmitting || !canSubmit}
            >Create account</Button>
          </Box>
        </Container>
      </div>
    );
  }

  async signUp() {
    this.setState({ isSubmitting: true });
    const dispatchAdmin = await ServerAdmin.get().dispatchAdmin();
    try {
      await dispatchAdmin.accountSignupAdmin({
        accountSignupAdmin: {
          name: this.state.name!,
          email: this.state.email!,
          password: saltHashPassword(this.state.pass!),
        }
      });
    } catch (err) {
      this.setState({ isSubmitting: false });
      return;
    }
    this.props.history.push('/dashboard/create');
  }
}

export default connect<ConnectProps, {}, Props, ReduxStateAdmin>((state, ownProps) => {
  if (state.plans.plans.status === undefined) {
    ServerAdmin.get().dispatchAdmin().then(d => d.plansGet());
  }
  return { plans: state.plans.plans.plans };
})(withStyles(styles, { withTheme: true })(SignupPage));
