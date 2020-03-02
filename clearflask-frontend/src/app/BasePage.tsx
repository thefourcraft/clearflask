import React, { Component } from 'react';
import { withStyles, Theme, createStyles, WithStyles } from '@material-ui/core/styles';
import Footer from './Footer';
import { Fade } from '@material-ui/core';

const styles = (theme:Theme) => createStyles({
  // Required for AnimatedSwitch to overlap two pages during animation
  animationContainer: {
    flexGrow: 1,
    // position: 'absolute' as 'absolute',
    width: '100%',
  },
  page: {
    maxWidth: '1024px',
    margin: '0px auto',
  },
  anchor: {
    position: 'relative' as 'relative',
  },
  grow: {
    flexGrow: 1,
  },
});

interface Props {
  showFooter?:boolean;
}

class BasePage extends Component<Props&WithStyles<typeof styles, true>> {
  readonly styles = {
  };

  render() {
    return (
      <React.Fragment>
        <div className={this.props.classes.animationContainer}>
          <div className={this.props.classes.page}>
            <div className={this.props.classes.anchor}>
              {this.props.children}
            </div>
          </div>
        </div>
        {this.props.showFooter && (
          <Footer />
        )}
      </React.Fragment>
    );
  }
}

export default withStyles(styles, { withTheme: true })(BasePage);