import React, { Component } from 'react';
import { withStyles, Theme, createStyles, WithStyles } from '@material-ui/core/styles';
import ServerAdmin, { ReduxStateAdmin } from '../api/serverAdmin';
import { Status } from '../api/server';
import { connect } from 'react-redux';
import * as Admin from '../api/admin';
import Loader from '../app/utils/Loader';
import BasePage from '../app/BasePage';
import MarkdownElement from '../app/utils/MarkdownElement';

const styles = (theme:Theme) => createStyles({
  page: {
    margin: theme.spacing(2),
  },
});

interface Props {
  type:'terms'|'privacy';
}
interface ConnectProps {
  legal?:Admin.LegalResponse;
  legalStatus?:Status;
}

class LegalPage extends Component<Props&ConnectProps&WithStyles<typeof styles, true>> {
  render() {
    var doc;
    switch(this.props.type) {
      case 'terms':
        doc = this.props.legal?.terms;
        break;
      case 'privacy':
        doc = this.props.legal?.privacy;
        break;
    }
    return (
      <BasePage>
        <Loader status={this.props.legalStatus}>
          <MarkdownElement text={doc} />
        </Loader>
      </BasePage>
    );
  }
}

export default connect<ConnectProps,{},Props,ReduxStateAdmin>((state, ownProps) => {
  if(state.legal.status === undefined) {
    ServerAdmin.get().dispatchAdmin().then(d => d.legalGet());
  }
  return {
    legal: state.legal.legal,
    legalStatus: state.legal.status,
  };
})(withStyles(styles, { withTheme: true })(LegalPage));
