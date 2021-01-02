import { Button, Collapse, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, InputAdornment, List, ListItem, ListItemIcon, ListItemText, ListSubheader, TextField } from '@material-ui/core';
import { DialogProps } from '@material-ui/core/Dialog';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import withMobileDialog, { InjectedProps } from '@material-ui/core/withMobileDialog';
import { WithWidth } from '@material-ui/core/withWidth';
import DisabledIcon from '@material-ui/icons/Block';
import EmailIcon from '@material-ui/icons/Email';
/** Alternatives: NotificationsActive, Web */
import WebPushIcon from '@material-ui/icons/NotificationsActive';
/** Alternatives: AccountCircle, Fingerprint, HowToReg, Person, PersonAdd, OpenInNew */
import NewWindowIcon from '@material-ui/icons/OpenInNew';
/** Alternatives: PhonelinkRing, Vibration */
import MobilePushIcon from '@material-ui/icons/PhonelinkRing';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import SilentIcon from '@material-ui/icons/Web';
import { withSnackbar, WithSnackbarProps } from 'notistack';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as Client from '../../api/client';
import { ReduxState, Server, Status } from '../../api/server';
import AcceptTerms from '../../common/AcceptTerms';
import Hr from '../../common/Hr';
import MobileNotification, { Device } from '../../common/notification/mobileNotification';
import WebNotification from '../../common/notification/webNotification';
import SubmitButton from '../../common/SubmitButton';
import { saltHashPassword } from '../../common/util/auth';
import { detectEnv, Environment } from '../../common/util/detectEnv';
import randomUuid from '../../common/util/uuid';
import { BIND_SUCCESS_LOCALSTORAGE_EVENT_KEY } from '../App';
import DigitsInput from '../utils/DigitsInput';
type WithMobileDialogProps = InjectedProps & Partial<WithWidth>;

enum NotificationType {
  Email = 'email',
  Browser = 'browser',
  Ios = 'ios',
  Android = 'android',
  Silent = 'silent',
  SSO = 'sso',
  OAuth = 'oauth',
}

export interface OAuthState {
  csrf: string;
  oid: string;
}
export const OAUTH_CODE_PARAM_NAME = 'code';
export const OAUTH_STATE_PARAM_NAME = 'state';
export const OAUTH_CSRF_SESSIONSTORAGE_KEY_PREFIX = 'oauth-state';

const styles = (theme: Theme) => createStyles({
  content: {
    display: 'flex',
  },
  notificationList: {
    padding: '0px',
  },
  accountFieldsContainer: {
    display: 'flex',
    transition: theme.transitions.create(['max-width', 'max-height']),
    width: 'min-content',
    overflow: 'hidden',
  },
  loginFieldsContainer: {
    width: 'min-content',
    overflow: 'hidden',
  },
  noWrap: {
    whiteSpace: 'nowrap',
  },
  allowButton: {
    margin: 'auto',
    display: 'block',
  },
  bold: {
    fontWeight: 'bold',
  },
});

export interface Props {
  server: Server;
  open?: boolean;
  onClose?: () => void;
  onLoggedInAndClose: () => void;
  actionTitle?: string;
  overrideWebNotification?: WebNotification;
  overrideMobileNotification?: MobileNotification;
  DialogProps?: Partial<DialogProps>;
  forgotEmailDialogProps?: Partial<DialogProps>;
}

interface ConnectProps {
  configver?: string;
  config?: Client.Config;
  onboardBefore?: Client.Onboarding;
  loggedInUser?: Client.UserMe;
}

interface State {
  open?: boolean;
  notificationType?: NotificationType;
  oauthType?: string;
  notificationDataAndroid?: string;
  notificationDataIos?: string;
  notificationDataBrowser?: string;
  displayName?: string;
  email?: string;
  pass?: string;
  revealPassword?: boolean;
  isLogin?: boolean;
  awaitExternalBind?: 'recovery' | 'sso' | 'oauth';
  isSubmitting?: boolean;
  emailVerifyDialog?: boolean;
  emailVerification?: (number | undefined)[];
}

class LogIn extends Component<Props & ConnectProps & WithStyles<typeof styles, true> & WithSnackbarProps & WithMobileDialogProps, State> {
  state: State = {};
  storageListener?: any;

  componentWillUnmount() {
    this.storageListener && window.removeEventListener('storage', this.storageListener);
  }

  render() {
    if (!this.props.open) return null;

    const onboarding = this.props.config?.users.onboarding || this.props.onboardBefore;

    const notifOpts: Set<NotificationType> = new Set();
    const oauthOpts: Array<Client.NotificationMethodsOauth> = onboarding?.notificationMethods.oauth || [];
    if (onboarding) {
      // if (onboarding.notificationMethods.mobilePush === true
      //   && (this.props.overrideMobileNotification || MobileNotification.getInstance()).canAskPermission()) {
      //   switch ((this.props.overrideMobileNotification || MobileNotification.getInstance()).getDevice()) {
      //     case Device.Android:
      //       notifOpts.add(NotificationType.Android);
      //       break;
      //     case Device.Ios:
      //       notifOpts.add(NotificationType.Ios);
      //       break;
      //   }
      // }
      if (onboarding.notificationMethods.browserPush === true
        && (this.props.overrideWebNotification || WebNotification.getInstance()).canAskPermission()) {
        notifOpts.add(NotificationType.Browser);
      }
      if (onboarding.notificationMethods.anonymous
        && (onboarding.notificationMethods.anonymous.onlyShowIfPushNotAvailable !== true
          || (!notifOpts.has(NotificationType.Android) && !notifOpts.has(NotificationType.Ios) && !notifOpts.has(NotificationType.Browser)))) {
        notifOpts.add(NotificationType.Silent)
      }
      if (onboarding.notificationMethods.email && onboarding.notificationMethods.email.mode === Client.EmailSignupModeEnum.SignupAndLogin) {
        notifOpts.add(NotificationType.Email);
      }
      if (onboarding.notificationMethods.sso) {
        notifOpts.add(NotificationType.SSO);
      }
      if (oauthOpts.length > 0) {
        notifOpts.add(NotificationType.OAuth);
      }
    }

    var dialogContent;
    if (!!this.props.loggedInUser) {
      dialogContent = (
        <React.Fragment>
          <DialogContent>
            <DialogContentText>You are logged in as <span className={this.props.classes.bold}>{this.props.loggedInUser.name || this.props.loggedInUser.email || 'Anonymous'}</span></DialogContentText>
          </DialogContent>
          <DialogActions>
            {!!this.props.onClose && (
              <Button onClick={this.props.onClose.bind(this)}>Cancel</Button>
            )}
            <Button color='primary' onClick={this.props.onLoggedInAndClose.bind(this)}>Continue</Button>
          </DialogActions>
        </React.Fragment>
      );
    } else {
      const signupAllowed = notifOpts.size > 0;
      const loginAllowed = !!onboarding?.notificationMethods.email;
      const isLogin = (signupAllowed && loginAllowed) ? this.state.isLogin : loginAllowed;
      const onlySingleOption = notifOpts.size === 1 && oauthOpts.length <= 1;
      const singleColumnLayout = this.props.fullScreen || onlySingleOption;

      const selectedNotificationType = !isLogin && (this.state.notificationType && notifOpts.has(this.state.notificationType))
        ? this.state.notificationType
        : (onlySingleOption ? notifOpts.values().next().value : undefined);
      const selectedOauthType = selectedNotificationType === NotificationType.OAuth && (this.state.oauthType
        ? this.state.oauthType
        : oauthOpts[0]?.oauthId);

      const showEmailInput = selectedNotificationType === NotificationType.Email;
      const emailValid = this.isEmailValid(this.state.email);
      const emailAllowedDomain = this.isAllowedDomain(this.state.email);
      const showDisplayNameInput = onboarding && signupAllowed && onboarding.accountFields.displayName !== Client.AccountFieldsDisplayNameEnum.None && selectedNotificationType !== NotificationType.SSO;
      const isDisplayNameRequired = onboarding && onboarding.accountFields.displayName === Client.AccountFieldsDisplayNameEnum.Required;
      const showAccountFields = !isLogin && (showEmailInput || showDisplayNameInput);
      const showPasswordInput = onboarding && onboarding.notificationMethods.email && onboarding.notificationMethods.email.password !== Client.EmailSignupPasswordEnum.None;
      const isPasswordRequired = onboarding && onboarding.notificationMethods.email && onboarding.notificationMethods.email.password === Client.EmailSignupPasswordEnum.Required;
      const isSignupSubmittable = selectedNotificationType
        && (selectedNotificationType !== NotificationType.SSO)
        && (selectedNotificationType !== NotificationType.Android || this.state.notificationDataAndroid)
        && (selectedNotificationType !== NotificationType.Ios || this.state.notificationDataIos)
        && (selectedNotificationType !== NotificationType.Browser || this.state.notificationDataBrowser)
        && (!isDisplayNameRequired || this.state.displayName)
        && (selectedNotificationType !== NotificationType.Email || (emailValid && emailAllowedDomain))
        && (!isPasswordRequired || this.state.pass);
      const isLoginSubmittable = emailValid;
      const isSubmittable = isLogin ? isLoginSubmittable : isSignupSubmittable;

      const onlySingleOptionRequiresAllow = onlySingleOption &&
        ((selectedNotificationType === NotificationType.Android && !this.state.notificationDataAndroid)
          || (selectedNotificationType === NotificationType.Ios && !this.state.notificationDataIos)
          || (selectedNotificationType === NotificationType.Browser && !this.state.notificationDataBrowser));

      dialogContent = (
        <React.Fragment>
          <DialogContent>
            <Collapse in={!isLogin}>
              <div
                className={this.props.classes.content}
                style={singleColumnLayout ? { flexDirection: 'column' } : undefined}
              >
                <List component='nav' className={this.props.classes.notificationList}>
                  <ListSubheader className={this.props.classes.noWrap} component="div">{this.props.actionTitle || 'Create account'}</ListSubheader>
                  <Collapse in={notifOpts.has(NotificationType.SSO)}>
                    <ListItem
                      button={!onlySingleOption as any}
                      selected={!onlySingleOption && selectedNotificationType === NotificationType.SSO}
                      onClick={!onlySingleOption ? this.onClickSsoNotif.bind(this) : e => this.setState({ notificationType: NotificationType.SSO })}
                      disabled={this.state.isSubmitting}
                    >
                      <ListItemIcon><NewWindowIcon /></ListItemIcon>
                      <ListItemText primary={onboarding?.notificationMethods.sso?.buttonTitle
                        || this.props.config?.name
                        || 'External'} />
                    </ListItem>
                    <Collapse in={onlySingleOption}>
                      <Button color='primary' className={this.props.classes.allowButton} onClick={this.onClickSsoNotif.bind(this)}>Open</Button>
                    </Collapse>
                  </Collapse>
                  {oauthOpts.map(oauthOpt => (
                    <Collapse in={notifOpts.has(NotificationType.OAuth)}>
                      <ListItem
                        button={!onlySingleOption as any}
                        selected={!onlySingleOption && selectedNotificationType === NotificationType.OAuth && selectedOauthType === oauthOpt.oauthId}
                        onClick={!onlySingleOption
                          ? e => this.onClickOauthNotif(oauthOpt)
                          : e => this.setState({
                            notificationType: NotificationType.OAuth,
                            oauthType: oauthOpt.oauthId,
                          })}
                        disabled={this.state.isSubmitting}
                      >
                        <ListItemIcon><NewWindowIcon /></ListItemIcon>
                        <ListItemText primary={oauthOpt.buttonTitle} />
                      </ListItem>
                      <Collapse in={onlySingleOption}>
                        <Button color='primary' className={this.props.classes.allowButton} onClick={e => this.onClickOauthNotif(oauthOpt)}>Open</Button>
                      </Collapse>
                    </Collapse>
                  ))}
                  <Collapse in={notifOpts.has(NotificationType.Android) || notifOpts.has(NotificationType.Ios)}>
                    <ListItem
                      // https://github.com/mui-org/material-ui/pull/15049
                      button={!onlySingleOption as any}
                      selected={!onlySingleOption && (selectedNotificationType === NotificationType.Android || selectedNotificationType === NotificationType.Ios)}
                      onClick={!onlySingleOption ? this.onClickMobileNotif.bind(this) : undefined}
                      disabled={onlySingleOptionRequiresAllow || this.state.isSubmitting}
                    >
                      <ListItemIcon><MobilePushIcon /></ListItemIcon>
                      <ListItemText primary='Mobile Push' className={this.props.classes.noWrap} />
                    </ListItem>
                    <Collapse in={onlySingleOptionRequiresAllow}>
                      <Button color='primary' className={this.props.classes.allowButton} onClick={this.onClickMobileNotif.bind(this)}>Allow</Button>
                    </Collapse>
                  </Collapse>
                  <Collapse in={notifOpts.has(NotificationType.Browser)}>
                    <ListItem
                      button={!onlySingleOption as any}
                      selected={!onlySingleOption && selectedNotificationType === NotificationType.Browser}
                      onClick={!onlySingleOption ? this.onClickWebNotif.bind(this) : undefined}
                      disabled={onlySingleOptionRequiresAllow || this.state.isSubmitting}
                    >
                      <ListItemIcon><WebPushIcon /></ListItemIcon>
                      <ListItemText primary='Browser Push' className={this.props.classes.noWrap} />
                    </ListItem>
                    <Collapse in={onlySingleOptionRequiresAllow}>
                      <Button color='primary' className={this.props.classes.allowButton} onClick={this.onClickWebNotif.bind(this)}>Allow</Button>
                    </Collapse>
                  </Collapse>
                  <Collapse in={notifOpts.has(NotificationType.Email)}>
                    <ListItem
                      button={!onlySingleOption as any}
                      selected={!onlySingleOption && selectedNotificationType === NotificationType.Email}
                      onClick={!onlySingleOption ? e => this.setState({ notificationType: NotificationType.Email }) : undefined}
                      disabled={this.state.isSubmitting}
                    >
                      <ListItemIcon><EmailIcon /></ListItemIcon>
                      <ListItemText primary='Email' className={this.props.classes.noWrap} />
                    </ListItem>
                  </Collapse>
                  <Collapse in={notifOpts.has(NotificationType.Silent)}>
                    <ListItem
                      button={!onlySingleOption as any}
                      selected={!onlySingleOption && selectedNotificationType === NotificationType.Silent}
                      onClick={!onlySingleOption ? e => this.setState({ notificationType: NotificationType.Silent }) : undefined}
                      disabled={this.state.isSubmitting}
                    >
                      <ListItemIcon><SilentIcon /></ListItemIcon>
                      <ListItemText primary={onlySingleOption ? 'In-App' : 'In-App Only'} />
                    </ListItem>
                  </Collapse>
                  <Collapse in={!signupAllowed && !loginAllowed}>
                    <ListItem
                      disabled={true}
                    >
                      <ListItemIcon><DisabledIcon /></ListItemIcon>
                      <ListItemText primary={!signupAllowed && !loginAllowed ? 'Signups are disabled' : undefined} />
                    </ListItem>
                  </Collapse>
                </List>
                <div
                  className={this.props.classes.accountFieldsContainer}
                  style={{
                    maxWidth: showAccountFields ? '400px' : '0px',
                    maxHeight: showAccountFields ? '400px' : '0px',
                  }}
                >
                  {!singleColumnLayout && (<Hr vertical isInsidePaper length='25%' />)}
                  <div>
                    <ListSubheader className={this.props.classes.noWrap} component="div">Your info</ListSubheader>
                    {showDisplayNameInput && (
                      <TextField
                        variant='outlined'
                        size='small'
                        fullWidth
                        required={isDisplayNameRequired}
                        value={this.state.displayName || ''}
                        onChange={e => this.setState({ displayName: e.target.value })}
                        label='Display name'
                        helperText={(<span className={this.props.classes.noWrap}>How others see you</span>)}
                        margin='normal'
                        classes={{ root: this.props.classes.noWrap }}
                        style={{ marginTop: '0px' }}
                        disabled={this.state.isSubmitting}
                      />
                    )}
                    <Collapse in={showEmailInput} unmountOnExit>
                      <div>
                        <TextField
                          variant='outlined'
                          size='small'
                          fullWidth
                          required
                          value={this.state.email || ''}
                          onChange={e => this.setState({ email: e.target.value })}
                          label='Email'
                          type='email'
                          error={!!this.state.email && (!emailValid || !emailAllowedDomain)}
                          helperText={(<span className={this.props.classes.noWrap}>{
                            !this.state.email || emailAllowedDomain ? 'Where to send you updates' : `Allowed domains: ${onboarding?.notificationMethods.email?.allowedDomains?.join(', ')}`}</span>)}
                          margin='normal'
                          style={{ marginTop: showDisplayNameInput ? undefined : '0px' }}
                          disabled={this.state.isSubmitting}
                        />
                        {showPasswordInput && (
                          <TextField
                            variant='outlined'
                            size='small'
                            fullWidth
                            required={isPasswordRequired}
                            value={this.state.pass || ''}
                            onChange={e => this.setState({ pass: e.target.value })}
                            label='Password'
                            helperText={(<span className={this.props.classes.noWrap}>
                              {isPasswordRequired
                                ? 'Secure your account'
                                : 'Optionally secure your account'}
                            </span>)}
                            type={this.state.revealPassword ? 'text' : 'password'}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position='end'>
                                  <IconButton
                                    aria-label='Toggle password visibility'
                                    onClick={() => this.setState({ revealPassword: !this.state.revealPassword })}
                                  >
                                    {this.state.revealPassword ? <VisibilityIcon fontSize='small' /> : <VisibilityOffIcon fontSize='small' />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                            margin='normal'
                            disabled={this.state.isSubmitting}
                          />
                        )}
                      </div>
                    </Collapse>
                  </div>
                </div>
              </div>
              {(signupAllowed || loginAllowed) && (
                <AcceptTerms overrideTerms={onboarding?.terms?.documents} />
              )}
            </Collapse>
            <Collapse in={!!isLogin}>
              <div className={this.props.classes.loginFieldsContainer}>
                <ListSubheader className={this.props.classes.noWrap} component="div">Login</ListSubheader>
                <div>
                  <TextField
                    variant='outlined'
                    size='small'
                    fullWidth
                    required
                    value={this.state.email || ''}
                    onChange={e => this.setState({ email: e.target.value })}
                    label='Email'
                    type='email'
                    error={!!this.state.email && !emailValid}
                    helperText={(<span className={this.props.classes.noWrap}>Email you used to sign up</span>)}
                    margin='normal'
                    style={{ marginTop: '0px' }}
                    disabled={this.state.isSubmitting}
                  />
                  <TextField
                    variant='outlined'
                    size='small'
                    fullWidth
                    value={this.state.pass || ''}
                    onChange={e => this.setState({ pass: e.target.value })}
                    label='Password'
                    helperText={(<span className={this.props.classes.noWrap}>Leave blank if you forgot</span>)}
                    type={this.state.revealPassword ? 'text' : 'password'}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            aria-label='Toggle password visibility'
                            onClick={() => this.setState({ revealPassword: !this.state.revealPassword })}
                          >
                            {this.state.revealPassword ? <VisibilityIcon fontSize='small' /> : <VisibilityOffIcon fontSize='small' />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    margin='normal'
                    disabled={this.state.isSubmitting}
                  />
                </div>
              </div>
            </Collapse>
          </DialogContent>
          <DialogActions>
            {!!loginAllowed && !!signupAllowed && (
              <SubmitButton
                onClick={() => this.setState({ isLogin: !isLogin })}
                isSubmitting={this.state.isSubmitting}
              >{isLogin ? 'Or Signup' : 'Or Login'}</SubmitButton>
            )}
            {(signupAllowed || loginAllowed) ? (
              <SubmitButton
                color='primary'
                isSubmitting={this.state.isSubmitting}
                disabled={!isSubmittable}
                onClick={() => {
                  if (!!isLogin && !this.state.pass) {
                    this.listenForExternalBind();
                    this.setState({ awaitExternalBind: 'recovery' });
                    this.props.server.dispatch().forgotPassword({
                      projectId: this.props.server.getProjectId(),
                      forgotPassword: {
                        email: this.state.email!,
                      },
                    });
                  } else if (!!isLogin && !!this.state.pass) {
                    this.setState({ isSubmitting: true });
                    this.props.server.dispatch().userLogin({
                      projectId: this.props.server.getProjectId(),
                      userLogin: {
                        email: this.state.email!,
                        password: saltHashPassword(this.state.pass),
                      },
                    }).then(() => {
                      this.setState({ isSubmitting: false });
                      this.props.onLoggedInAndClose();
                    }).catch(() => {
                      this.setState({ isSubmitting: false });
                    });
                  } else {
                    this.setState({ isSubmitting: true });
                    this.props.server.dispatch().userCreate({
                      projectId: this.props.server.getProjectId(),
                      userCreate: {
                        name: showDisplayNameInput ? this.state.displayName : undefined,
                        email: showEmailInput ? this.state.email : undefined,
                        password: (showPasswordInput && this.state.pass) ? saltHashPassword(this.state.pass) : undefined,
                        iosPushToken: selectedNotificationType === NotificationType.Ios ? this.state.notificationDataIos : undefined,
                        androidPushToken: selectedNotificationType === NotificationType.Android ? this.state.notificationDataAndroid : undefined,
                        browserPushToken: selectedNotificationType === NotificationType.Browser ? this.state.notificationDataBrowser : undefined,
                      },
                    }).then(userCreateResponse => {
                      if (userCreateResponse.requiresEmailVerification || !userCreateResponse.user) {
                        this.setState({
                          isSubmitting: false,
                          emailVerifyDialog: true,
                        });
                      } else {
                        this.setState({ isSubmitting: false });
                        this.props.onLoggedInAndClose();
                      }
                    }).catch(() => {
                      this.setState({ isSubmitting: false });
                    });
                  }
                }}
              >Continue</SubmitButton>
            ) : (!!this.props.onClose ? (
              <Button onClick={() => { this.props.onClose?.() }}>Back</Button>
            ) : null)}
          </DialogActions>
          <Dialog
            open={!!this.state.awaitExternalBind}
            onClose={() => this.setState({ awaitExternalBind: undefined })}
            maxWidth='xs'
            {...this.props.forgotEmailDialogProps}
          >
            <DialogTitle>Awaiting confirmation...</DialogTitle>
            <DialogContent>
              {this.state.awaitExternalBind === 'recovery' ? (
                <DialogContentText>We sent an email to <span className={this.props.classes.bold}>{this.state.email}</span>. Return to this page after clicking the confirmation link.</DialogContentText>
              ) : (
                  <DialogContentText>A popup was opened leading you to a sign-in page. After you complete sign-in, this dialog will automatically close.</DialogContentText>
                )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => this.setState({ awaitExternalBind: undefined })}>Cancel</Button>
            </DialogActions>
          </Dialog>
          <Dialog
            open={!!this.state.emailVerifyDialog}
            onClose={() => this.setState({ emailVerifyDialog: undefined })}
            maxWidth='xs'
          >
            <DialogTitle>Awaiting email verification...</DialogTitle>
            <DialogContent>
              <DialogContentText>We sent a verification email to <span className={this.props.classes.bold}>{this.state.email}</span>. Please copy the verification token from the email here:</DialogContentText>
              <DigitsInput
                digits={6}
                value={this.state.emailVerification}
                disabled={this.state.isSubmitting}
                onChange={(val, isComplete) => {
                  if (isComplete) {
                    this.setState({
                      emailVerification: val,
                      isSubmitting: true,
                    }, () => setTimeout(() => {
                      this.props.server.dispatch().userCreate({
                        projectId: this.props.server.getProjectId(),
                        userCreate: {
                          name: this.state.displayName,
                          email: this.state.email!,
                          emailVerification: val.join(),
                          password: this.state.pass ? saltHashPassword(this.state.pass) : undefined,
                        },
                      }).then(userCreateResponse => {
                        if (userCreateResponse.requiresEmailVerification || !userCreateResponse.user) {
                          this.setState({ isSubmitting: false });
                        } else {
                          this.setState({
                            isSubmitting: false,
                            emailVerifyDialog: undefined,
                          });
                          this.props.onLoggedInAndClose();
                        }
                      }).catch(() => {
                        this.setState({ isSubmitting: false });
                      });
                    }, 1));
                  } else {
                    this.setState({ emailVerification: val });
                  }
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => this.setState({ emailVerifyDialog: undefined })}>Cancel</Button>
            </DialogActions>
          </Dialog>
        </React.Fragment>
      );
    }

    return (
      <Dialog
        open={!!this.props.open}
        onClose={this.props.onClose}
        scroll='body'
        PaperProps={{
          style: {
            width: 'fit-content',
            marginLeft: 'auto',
            marginRight: 'auto',
          },
        }}
        {...this.props.DialogProps}
      >
        {dialogContent}
      </Dialog>
    );
  }

  isEmailValid(email?: string): boolean {
    if (!email) return false;
    const atIndex = email.indexOf('@');
    if (atIndex <= 0 || atIndex + 1 >= email.length) return false;
    return true;
  }

  isAllowedDomain(email?: string) {
    if (!email) return false;
    const onboarding = this.props.config?.users.onboarding || this.props.onboardBefore;
    if (onboarding?.notificationMethods.email?.allowedDomains) {
      return onboarding.notificationMethods.email.allowedDomains
        .some(allowedDomain => email.trim().endsWith(`@${allowedDomain}`));
    }
    return true;
  }

  listenForExternalBind() {
    if (this.storageListener) return;
    this.storageListener = (ev: StorageEvent) => {
      if (ev.key !== BIND_SUCCESS_LOCALSTORAGE_EVENT_KEY) return;
      if (detectEnv() === Environment.DEVELOPMENT_FRONTEND) {
        this.props.server.dispatch().userCreate({
          projectId: this.props.server.getProjectId(),
          userCreate: {
            email: 'mock@email.com',
            name: 'Mock User',
            ...{
              isExternal: true, // Only used during development, disregarded otherwise
            },
          },
        });
      } else {
        this.props.server.dispatch().userBind({
          projectId: this.props.server.getProjectId(),
          userBind: {},
        });
      }
    }
    window.addEventListener('storage', this.storageListener);
  }

  onClickOauthNotif(oauthConfig: Client.NotificationMethodsOauth) {
    const oauthCsrfToken = randomUuid();
    const oauthState: OAuthState = {
      csrf: oauthCsrfToken,
      oid: oauthConfig.oauthId,
    };
    const oauthStateStr = encodeURIComponent(JSON.stringify(oauthState));
    sessionStorage.setItem(`${OAUTH_CSRF_SESSIONSTORAGE_KEY_PREFIX}-${oauthConfig.oauthId}`, oauthCsrfToken);
    this.listenForExternalBind();
    this.setState({ awaitExternalBind: 'oauth' });
    window.open(`${oauthConfig.authorizeUrl}?`
      + `response_type=code`
      + `&client_id=${oauthConfig.clientId}`
      + `&redirect_uri=${window.location.protocol}//${window.location.host}/oauth`
      + `&scope=${oauthConfig.scope}`
      + `&${OAUTH_STATE_PARAM_NAME}=${oauthStateStr}`,
      `width=${document.documentElement.clientWidth * 0.9},height=${document.documentElement.clientHeight * 0.9}`);
  }

  onClickSsoNotif() {
    const onboarding = this.props.config?.users.onboarding || this.props.onboardBefore;
    if (!onboarding?.notificationMethods.sso?.redirectUrl) return;
    this.listenForExternalBind();
    this.setState({ awaitExternalBind: 'sso' });
    window.open(onboarding.notificationMethods.sso.redirectUrl
      .replace('<return_uri>', `${window.location.protocol}//${window.location.host}/sso`),
      `cf_${this.props.server.getProjectId()}_sso`,
      `width=${document.documentElement.clientWidth * 0.9},height=${document.documentElement.clientHeight * 0.9}`,
    );
  }

  onClickMobileNotif() {
    const device = (this.props.overrideMobileNotification || MobileNotification.getInstance()).getDevice();
    if (device === Device.None) return;
    this.setState({
      notificationType: device === Device.Android ? NotificationType.Android : NotificationType.Ios,
    });
    (this.props.overrideMobileNotification || MobileNotification.getInstance()).askPermission().then(r => {
      if (r.type === 'success') {
        this.setState({
          ...(r.device === Device.Android ? { notificationDataAndroid: r.token } : {}),
          ...(r.device === Device.Ios ? { notificationDataIos: r.token } : {}),
        });
      } else if (r.type === 'error') {
        if (r.userFacingMsg) {
          this.props.enqueueSnackbar(r.userFacingMsg || 'Failed to setup mobile push', { variant: 'error', preventDuplicate: true });
        }
        this.forceUpdate();
      }
    })
  }

  onClickWebNotif() {
    this.setState({
      notificationType: NotificationType.Browser,
    });
    (this.props.overrideWebNotification || WebNotification.getInstance()).askPermission().then(r => {
      if (r.type === 'success') {
        this.setState({
          notificationDataBrowser: r.token,
        });
      } else if (r.type === 'error') {
        if (r.userFacingMsg) {
          this.props.enqueueSnackbar(r.userFacingMsg || 'Failed to setup browser notifications', { variant: 'error', preventDuplicate: true });
        }
        this.forceUpdate();
      }
    });
  }
}

export default connect<ConnectProps, {}, Props, ReduxState>((state, ownProps) => {
  return {
    configver: state.conf.ver, // force rerender on config change
    config: state.conf.conf,
    onboardBefore: state.conf.onboardBefore,
    loggedInUser: state.users.loggedIn.status === Status.FULFILLED ? state.users.loggedIn.user : undefined,
  }
})(withStyles(styles, { withTheme: true })(withSnackbar(withMobileDialog<Props & ConnectProps & WithStyles<typeof styles, true> & WithSnackbarProps>({ breakpoint: 'xs' })(LogIn))));
