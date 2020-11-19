import { SvgIconTypeMap } from '@material-ui/core';
import { OverridableComponent } from '@material-ui/core/OverridableComponent';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import StarIcon from '@material-ui/icons/Star';
import React from 'react';

const styles = (theme: Theme) => createStyles({
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    color: theme.palette.primary.main,
  },
});

interface Props {
  name?: string | React.ReactNode;
  isMod?: boolean;
  overrideIcon?: OverridableComponent<SvgIconTypeMap> | null;
  overrideIconFontSize?: number | string;
}

class ModStar extends React.Component<Props & WithStyles<typeof styles, true>> {

  render() {
    if (!this.props.isMod) {
      return this.props.name || null;
    }
    const ModIcon = this.props.overrideIcon || StarIcon;
    return (
      <div className={this.props.classes.container}>
        {this.props.name}
        <ModIcon fontSize='inherit' style={{ fontSize: this.props.overrideIconFontSize || '0.8em' }} />
      </div>
    );
  }
}

export default withStyles(styles, { withTheme: true })(ModStar);
