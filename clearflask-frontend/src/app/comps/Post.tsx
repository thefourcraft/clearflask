import React, { Component } from 'react';
import * as Client from '../../api/client';
import { Typography, CardActionArea, Grid, Button, IconButton, LinearProgress, Popover, Grow, Collapse, Chip, Fade } from '@material-ui/core';
import { withStyles, Theme, createStyles, WithStyles } from '@material-ui/core/styles';
import Loader from '../utils/Loader';
import { connect } from 'react-redux';
import { ReduxState, Server, Status } from '../../api/server';
import TimeAgo from 'react-timeago'
/* alternatives: comment, chat bubble (outline), forum, mode comment, add comment */
import SpeechIcon from '@material-ui/icons/CommentOutlined';
import UpvoteIcon from '@material-ui/icons/ArrowDropUpRounded';
import DownvoteIcon from '@material-ui/icons/ArrowDropDownRounded'
/* Other potential icons: receipt, shopping cart, create, attach money, local atm, money, plus one */
import FundIcon from '@material-ui/icons/MoneyRounded';
import Truncate from 'react-truncate';
import { withRouter, RouteComponentProps, matchPath } from 'react-router';
import Expander from '../../common/Expander';
import Delimited from '../utils/Delimited';
import Comment from './Comment';
import LogIn from './LogIn';
import AddEmojiIcon from '@material-ui/icons/InsertEmoticon';
import AddIcon from '@material-ui/icons/Add';
import { Picker, BaseEmoji } from 'emoji-mart';
import GradientFade from '../../common/GradientFade';
import { PopoverPosition, PopoverActions } from '@material-ui/core/Popover';
import { fade } from '@material-ui/core/styles/colorManipulator';
import { withSnackbar, WithSnackbarProps } from 'notistack';
import FundingBar from './FundingBar';
import FundingControl from './FundingControl';
import { getCustomTheme } from '../AppThemeProvider';

const styles = (theme:Theme) => createStyles({
  page: {
    minWidth: 300,
  },
  list: {
    minWidth: 300,
  },
  comment: {
    margin: theme.spacing.unit,
  },
  leftColumn: {
    margin: theme.spacing.unit,
    marginRight: '0px',
  },
  rightColumn: {
    margin: theme.spacing.unit,
  },
  titleAndDescriptionOuter: {
    padding: theme.spacing.unit / 2,
  },
  titleAndDescriptionCard: {
    background: 'transparent',
  },
  titleAndDescription: {
    padding: theme.spacing.unit / 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textTransform: 'none',
  },
  button: {
    padding: `3px ${theme.spacing.unit / 2}px`,
    whiteSpace: 'nowrap',
    minWidth: 'unset',
    textTransform: 'unset',
  },
  timeAgo: {
    whiteSpace: 'nowrap',
    margin: theme.spacing.unit / 2,
  },
  commentCount: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    margin: theme.spacing.unit / 2,
  },
  author: {
    whiteSpace: 'nowrap',
    margin: theme.spacing.unit / 2,
  },
  voteIconButton: {
    fontSize: '2em',
    padding: '0px',
    color: theme.palette.text.hint,
  },
  voteIconButtonUp: {
    borderRadius: '80% 80% 50% 50%',
  },
  voteIconButtonDown: {
    borderRadius: '50% 50% 80% 80%',
  },
  voteIconVoted: {
    color: theme.palette.primary.main,
    transform: 'scale(1.25)',
  },
  voteCount: {
    lineHeight: '1em',
    fontSize: '0.9em',
  },
  expressionContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  expressionInner: {
    padding: '4px 6px',
  },
  expressionOuter: {
    height: 'auto',
    marginLeft: theme.spacing.unit / 4,
    marginRight: theme.spacing.unit / 4,
    borderRadius: '18px',
  },
  expressionHasExpressed: {
    borderColor: theme.palette.primary.main,
    backgroundColor: fade(theme.palette.primary.main, 0.04),
  },
  expressionNotExpressed: {
    borderColor: 'rgba(0,0,0,0)',
  },
  expression: {
    lineHeight: 1.15,
    fontSize: 16,
    display: 'inline-block',
    width: 16,
    height: 16,
    transform: 'translate(-1px,-1px)',  
    wordBreak: 'keep-all',
    fontFamily: '"Segoe UI Emoji", "Segoe UI Symbol", "Segoe UI", "Apple Color Emoji", "Twemoji Mozilla", "Noto Color Emoji", "EmojiOne Color", "Android Emoji"',
  },
  expressionExpressedNonButton: {
    border: '1px solid ' + theme.palette.primary.main,
    color: theme.palette.primary.main,
  },
  fundMoreButton: {
    height: 'auto',
    padding: 0,
    borderRadius: '18px',
    margin: theme.spacing.unit / 2,
  },
  fundThisButton: {
    alignSelf: 'flex-end',
    marginBottom: '-1px', // Fix baseline alignment when button is not present
  },
  fundThisButtonLabel: {
    display: 'flex',
    alignItems: 'center',
  },
  fundMoreLabel: {
    padding: '4px 6px',
  },
  fundMoreContainer: {
    width: 16,
    height: 16,
  },
  moreContainer: {
    lineHeight: 'unset',
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.text.hint,
  },
  moreMainIcon: {
    position: 'relative',
    width: 14,
    height: 14,
    top: 3,
  },
  moreAddIcon: {
    borderRadius: 16,
    width: 12,
    height: 12,
    position: 'relative',
    top: -4,
    left: -6,
  },
  expressionPicker: {
    '& .emoji-mart' : {
      color: theme.palette.text.primary + '!important',
    },
    '& .emoji-mart-anchor-icon svg' : {
      fill: theme.palette.text.hint + '!important',
    },
    '& .emoji-mart-search input::placeholder' : {
      color: theme.palette.text.hint + '!important',
    },
    '& .emoji-mart-search input' : {
      background: 'inherit' + '!important',
      border: '0px' + '!important',
      color: theme.palette.text.primary + '!important',
    },
    '& .emoji-mart-category-label span' : {
      background: fade(theme.palette.background.paper, .95) + '!important',
    },
  },
  bottomBarLine: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center', // TODO properly center items, neither center nor baseline works here
  },
  grow: {
    flexGrow: 1,
  },
  bottomBar: {
    margin:  theme.spacing.unit,
    marginTop: `-${theme.spacing.unit / 2}px`,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  commentSection: {
    marginTop: theme.spacing.unit * 2,
  },
  nothing: {
    margin: theme.spacing.unit * 4,
    color: theme.palette.text.hint,
  },
  funding: {
    margin:  theme.spacing.unit,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
});

export type PostVariant = 'list'|'page';

interface Props {
  server:Server;
  idea?:Client.Idea;
  variant:PostVariant;
  /**
   * If true, when post is clicked,
   * variant is switched from 'list' to 'page',
   * url is appended with /post/<postId>
   * and post is expanded to full screen.
   */
  expandable?:boolean;
  display?:Client.PostDisplay;
  onClickTag?:(tagId:string)=>void;
  onClickCategory?:(categoryId:string)=>void;
  onClickStatus?:(statusId:string)=>void;
}

interface ConnectProps {
  configver?:string;
  projectId:string;
  category?:Client.Category;
  credits?:Client.Credits;
  maxFundAmountSeen:number;
  authorUser?:Client.User;
  vote?:Client.Vote;
  loggedInUser?:Client.User;
  commentsStatus?:Status;
  comments?:(Client.CommentWithAuthor|undefined)[]
  commentCursor?:string;
  updateVote: (voteUpdate:Partial<Client.VoteUpdate>)=>Promise<Client.VoteUpdateResponse>;
}


interface State {
  fundingExpanded?:boolean;
  fundingExpandedAnchor?:PopoverPosition&{width:number};
  expressionExpanded?:boolean;
  expressionExpandedAnchor?:PopoverPosition;
  logInOpen?:boolean;
  isSubmittingUpvote?:boolean;
  isSubmittingDownvote?:boolean;
  isSubmittingFund?:boolean;
  isSubmittingExpression?:boolean;
}

export const isExpanded = ():boolean => !!Post.expandedPath;

class Post extends Component<Props&ConnectProps&RouteComponentProps&WithStyles<typeof styles, true>&WithSnackbarProps, State> {
  /**
   * expandedPath allows a page transition from a list of posts into a
   * single post without having to render a new page.
   */
  static expandedPath:string|undefined;
  expandedPath:string|undefined;
  onLoggedIn?:()=>void;

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillUnmount() {
    if(Post.expandedPath === this.expandedPath) {
      Post.expandedPath = undefined;
    }
  }

  render() {
    var forceExpand = false;
    if(this.expandedPath) {
      if(this.expandedPath !== Post.expandedPath) {
        this.expandedPath = undefined;
      } else if(this.expandedPath !== this.props.location.pathname) {
        this.expandedPath = undefined;
        Post.expandedPath = undefined;
      } else {
        forceExpand = true;
      }
    }
    const variant = forceExpand ? 'page' : this.props.variant;

    const voting = this.renderVoting(variant);
    return (
      <Loader loaded={!!this.props.idea}>
      <Expander expand={forceExpand}>
        <div className={variant === 'page' ? this.props.classes.page : this.props.classes.list} style={{
          display: 'flex',
          alignItems: 'flex-start',
        }}>
          {voting && (
            <div className={this.props.classes.leftColumn}>
              {voting}
            </div>
          )}
          <div className={this.props.classes.rightColumn} style={{
            display: 'flex',
            flexDirection: 'column',
          }}>
            {this.renderFunding(variant)}
            <div className={this.props.classes.titleAndDescriptionOuter}>
              <CardActionArea
                className={this.props.classes.titleAndDescription}
                disabled={!this.props.expandable || variant === 'page'}
                onClick={this.onExpand.bind(this)}
                classes={{
                  focusHighlight: this.props.classes.titleAndDescriptionCard,
                }}
              >
                {this.renderTitle(variant)}
                {this.renderDescription(variant)}
              </CardActionArea>
            </div>
            {this.renderBottomBar(variant)}
            {this.renderComments(variant)}
          </div>
        </div>
      </Expander>
      </Loader>
    );
  }

  renderBottomBar(variant:PostVariant) {
    const leftSide = [
      this.renderExpression(variant),
      this.renderCommentCount(variant),
      this.renderCreatedDatetime(variant),
      this.renderAuthor(variant),
    ].filter(i => !!i);
    const rightSide = [
      this.renderStatus(variant),
      this.renderCategory(variant),
      ...(this.renderTags(variant) || []),
    ].filter(i => !!i);

    if(leftSide.length + rightSide.length === 0) return null;

    return (
      <div className={this.props.classes.bottomBar}>
        <div className={this.props.classes.bottomBarLine}>
          <Delimited>
            {leftSide}
          </Delimited>
        </div>
        <div className={this.props.classes.grow} />
        <div className={this.props.classes.bottomBarLine}>
          <Delimited>
            {rightSide}
          </Delimited>
        </div>
        <LogIn
          server={this.props.server}
          open={this.state.logInOpen}
          onClose={() => this.setState({logInOpen: false})}
          onLoggedInAndClose={() => {
            this.setState({logInOpen: false});
            this.onLoggedIn && this.onLoggedIn();
            this.onLoggedIn = undefined;
          }}
        />
      </div>
    );
  }

  renderAuthor(variant:PostVariant) {
    if(variant !== 'page' && this.props.display && this.props.display.showAuthor === false
      || !this.props.authorUser) return null;

    return (
      <Typography className={this.props.classes.author} variant='caption' inline>
        {this.props.authorUser.name}
      </Typography>
    );
  }

  renderCreatedDatetime(variant:PostVariant) {
    if(variant !== 'page' && this.props.display && this.props.display.showCreated === false
      || !this.props.idea) return null;

    return (
      <Typography className={this.props.classes.timeAgo} variant='caption' inline>
        <TimeAgo date={this.props.idea.created} />
      </Typography>
    );
  }

  renderCommentCount(variant:PostVariant) {
    if(this.props.display && this.props.display.showCommentCount === false
      || variant === 'page'
      || !this.props.idea
      || !this.props.category
      || !this.props.category.support.comment) return null;

    return (
      <Typography className={this.props.classes.commentCount} variant='caption' inline>
        <SpeechIcon fontSize='inherit' />
        &nbsp;
        {this.props.idea.commentCount || 0}
      </Typography>
    );
  }

  renderComments(variant:PostVariant) {
    if(variant !== 'page'
      || !this.props.idea
      || !this.props.category
      || !this.props.category.support.comment) return null;

    if(!this.props.commentsStatus) {
      this.props.server.dispatch().commentList({
        projectId: this.props.server.getProjectId(),
        ideaId: this.props.idea.ideaId,
      });
    }

    // TODO infinite scroll this.props.commentCursor
    return (
      <div className={this.props.classes.commentSection}>
        <Loader loaded={!!this.props.comments}>
          {this.props.comments && (this.props.comments.length > 0 ? (this.props.comments.map(comment => (
            <Comment comment={comment} />
          ))) : (
            <Typography variant='overline' className={this.props.classes.nothing}>Nothing found</Typography>
          ))}
        </Loader>
      </div>
    );
  }

  renderStatus(variant:PostVariant) {
    if(variant !== 'page' && this.props.display && this.props.display.showStatus === false
      || !this.props.idea
      || !this.props.idea.statusId
      || !this.props.category) return null;

    const status = this.props.category.workflow.statuses.find(s => s.statusId === this.props.idea!.statusId);
    if(!status) return null;

    return (
      <Button variant="text" className={this.props.classes.button} disabled={!this.props.onClickStatus || variant === 'page'}
        onClick={e => this.props.onClickStatus && this.props.onClickStatus(status.statusId)}>
        <Typography variant='caption' style={{color: status.color}}>
          {status.name}
        </Typography>
      </Button>
    );
  }

  renderTags(variant:PostVariant) {
    if(variant !== 'page' && this.props.display && this.props.display.showTags === false
      || !this.props.idea
      || this.props.idea.tagIds.length === 0
      || !this.props.category) return null;

    return this.props.idea.tagIds
    .map(tagId => this.props.category!.tagging.tags.find(t => t.tagId === tagId))
    .filter(tag => !!tag)
    .map(tag => (
      <Button variant="text" className={this.props.classes.button} disabled={!this.props.onClickTag || variant === 'page'}
        onClick={e => this.props.onClickTag && this.props.onClickTag(tag!.tagId)}>
        <Typography variant='caption' style={{color: tag!.color}}>
          {tag!.name}
        </Typography>
      </Button>
    ));
  }

  renderCategory(variant:PostVariant) {
    if(variant !== 'page' && this.props.display && this.props.display.showCategoryName === false
      || !this.props.idea
      || !this.props.category) return null;
      
    return (
      <Button variant="text" className={this.props.classes.button} disabled={!this.props.onClickCategory || variant === 'page'}
        onClick={e => this.props.onClickCategory && this.props.onClickCategory(this.props.category!.categoryId)}>
        <Typography variant='caption' style={{color: this.props.category.color}}>
          {this.props.category.name}
        </Typography>
      </Button>
    );
  }

  renderVoting(variant:PostVariant) {
    if(variant !== 'page' && this.props.display && this.props.display.showVoting === false
      || !this.props.idea
      || !this.props.category
      || !this.props.category.support.vote) return null;

    const upvoted:boolean = (!!this.props.vote && this.props.vote.vote === Client.VoteVoteEnum.Upvote) !== !!this.state.isSubmittingUpvote;
    const downvoted:boolean = (!!this.props.vote && this.props.vote.vote === Client.VoteVoteEnum.Downvote) !== !!this.state.isSubmittingDownvote;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <IconButton
          color={upvoted ? 'primary' : undefined}
          className={`${this.props.classes.voteIconButton} ${this.props.classes.voteIconButtonUp} ${upvoted ? this.props.classes.voteIconVoted : ''}`}
          onClick={e => {
            const upvote = () => {
              if(this.state.isSubmittingUpvote) return;
              this.setState({isSubmittingUpvote: true});
              this.props.updateVote({vote: (this.props.vote && this.props.vote.vote === Client.VoteVoteEnum.Upvote)
                ? Client.VoteUpdateVoteEnum.None : Client.VoteUpdateVoteEnum.Upvote})
                .then(()=>this.setState({isSubmittingUpvote: false}),
                  ()=>this.setState({isSubmittingUpvote: false}));
            };
            if(this.props.loggedInUser) {
              upvote();
            } else {
              this.onLoggedIn = upvote;
              this.setState({logInOpen: true});
            }
          }}>
          <UpvoteIcon fontSize='inherit' />
        </IconButton>
        <Typography variant='overline' className={this.props.classes.voteCount}>
          {this.props.idea.voteValue || 0}
        </Typography>
        
        {this.props.category.support.vote.enableDownvotes && (
          <IconButton
            color={downvoted ? 'primary' : undefined}
            className={`${this.props.classes.voteIconButton} ${this.props.classes.voteIconButtonDown} ${downvoted ? this.props.classes.voteIconVoted : ''}`}
            onClick={e => {
              if(this.state.isSubmittingDownvote) return;
              const downvote = () => {
                this.setState({isSubmittingDownvote: true});
                this.props.updateVote({vote: (this.props.vote && this.props.vote.vote === Client.VoteVoteEnum.Downvote)
                  ? Client.VoteUpdateVoteEnum.None : Client.VoteUpdateVoteEnum.Downvote})
                  .then(()=>this.setState({isSubmittingDownvote: false}),
                    ()=>this.setState({isSubmittingDownvote: false}));
              };
              if(this.props.loggedInUser) {
                downvote();
              } else {
                this.onLoggedIn = downvote;
                this.setState({logInOpen: true});
              }
            }}>
            <DownvoteIcon fontSize='inherit' />
          </IconButton>
        )}
      </div>
    );
  }

  fundingBarRef:React.RefObject<HTMLDivElement> = React.createRef();
  fundingPopoverActions?:PopoverActions;
  renderFunding(variant:PostVariant) {
    if(variant !== 'page' && this.props.display && this.props.display.showFunding === false
      || !this.props.idea
      || !this.props.credits
      || !this.props.category
      || !this.props.category.support.fund) return null;

    const fundingAllowed = !this.props.idea.statusId
      || this.props.category.workflow.statuses.find(s => s.statusId === this.props.idea!.statusId)!
        .disableFunding !== true;
    const iFundedThis = this.props.vote && this.props.vote.fundAmount && this.props.vote.fundAmount > 0;
    const padding = this.props.theme.spacing.unit * 3;

    const fundThisButton = (
      <Button
        color={iFundedThis ? 'primary' : 'default'}
        classes={{
          root: `${this.props.classes.button} ${this.props.classes.fundThisButton}`,
        }}
        disabled={!fundingAllowed}
        onClick={!fundingAllowed ? undefined : (e => {
          const onLoggedInClick = () => {
            this.setState({
              fundingExpanded: true,
              fundingExpandedAnchor: {
                width: this.fundingBarRef.current!.getBoundingClientRect().width,
                top: this.fundingBarRef.current!.getBoundingClientRect().top - padding,
                left: this.fundingBarRef.current!.getBoundingClientRect().left - padding}
              },
            )
          };
          if(this.props.loggedInUser) {
            onLoggedInClick();
          } else {
            this.onLoggedIn = onLoggedInClick;
            this.setState({logInOpen: true});
          }
        })}
      >
        <Typography
          variant='caption'
          className={this.props.classes.fundThisButtonLabel}
          color={iFundedThis ? 'primary' : 'default'}
        >
          {fundingAllowed ?
            [<AddIcon fontSize='inherit' />,
            iFundedThis ? 'Adjust funding' : 'Fund this']
            : 'Funding has ended'}
        </Typography>
      </Button>
    );

    return (
      <div className={this.props.classes.funding}>
        <FundingBar
          fundingBarRef={this.fundingBarRef}
          idea={this.props.idea}
          credits={this.props.credits}
          vote={this.props.vote}
          maxFundAmountSeen={this.props.maxFundAmountSeen}
          style={{alignSelf: 'stretch'}}
          overrideRight={fundThisButton}
        />
        {fundingAllowed && (
          <Popover
            TransitionComponent={Fade}
            open={!!this.state.fundingExpanded}
            anchorReference='anchorPosition'
            anchorPosition={this.state.fundingExpandedAnchor}
            onClose={() => this.setState({fundingExpanded: false})}
            anchorOrigin={{ vertical: 'top', horizontal: 'left', }}
            transformOrigin={{ vertical: 'top', horizontal: 'left', }}
            marginThreshold={2}
            PaperProps={{
              style: {
                overflow: 'hidden',
                width: this.state.fundingExpandedAnchor ? this.state.fundingExpandedAnchor.width + padding * 2 : 0,
                padding: padding,
              }
            }}
            disableRestoreFocus
            action={actions => this.fundingPopoverActions = actions}
          >
            <FundingControl
              server={this.props.server}
              idea={this.props.idea}
              vote={this.props.vote}
              onOtherFundedIdeasLoaded={() => this.fundingPopoverActions && this.fundingPopoverActions.updatePosition()}
            />
          </Popover>
        )}
      </div>
    );
  }

  renderExpressionEmoji(key:string, display:string|React.ReactNode, hasExpressed:boolean, onLoggedInClick:(currentTarget:HTMLElement)=>void, count:number = 0) {
    return (
      <Chip
        clickable
        key={key}
        variant='outlined'
        color={hasExpressed ? 'primary' : 'default'}
        onClick={e => {
          const currentTarget = e.currentTarget;
          if(this.props.loggedInUser) {
            onLoggedInClick(currentTarget);
          } else {
            this.onLoggedIn = () => onLoggedInClick(currentTarget);
            this.setState({logInOpen: true});
          }
        }}
        classes={{
          label: this.props.classes.expressionInner,
          root: `${this.props.classes.expressionOuter} ${hasExpressed ? this.props.classes.expressionHasExpressed : this.props.classes.expressionNotExpressed}`,
        }}
        label={(
          <div style={{display: 'flex', alignItems: 'center'}}>
            <span className={this.props.classes.expression}>{display}</span>
            {count > 0 && (<Typography variant='caption' color={hasExpressed ? 'primary' : 'default'} inline>&nbsp;{count}</Typography>)}
          </div>
        )}
      />
    );
  }

  renderExpression(variant:PostVariant) {
    if(variant !== 'page' && this.props.display && this.props.display.showExpression === false
      || !this.props.idea
      || !this.props.category
      || !this.props.category.support.express) return null;
    
    const padding = this.props.theme.spacing.unit / 2;
    const limitEmojiPerIdea = this.props.category.support.express.limitEmojiPerIdea;
    const reachedLimitPerIdea = limitEmojiPerIdea !== undefined && (this.props.vote && this.props.vote.expressions && this.props.vote.expressions.length || 0) >= limitEmojiPerIdea;

    const getHasExpressed = (display:string):boolean => {
      return this.props.vote
        && this.props.vote.expressions
        && this.props.vote.expressions.includes(display)
        || false;
    };  
    const clickExpression = (display:string) => {
      const expressionDiff:Client.VoteUpdateExpressions = {};
      const hasExpressed = getHasExpressed(display);
      if(limitEmojiPerIdea === 1) {
        if(hasExpressed) {
          expressionDiff.remove = [display];
        } else {
          expressionDiff.add = [display];
          expressionDiff.remove = this.props.vote && this.props.vote.expressions || undefined;
        }
      } else if(!hasExpressed && reachedLimitPerIdea) {
        this.props.enqueueSnackbar("Whoa, that's too many", { variant: 'error', preventDuplicate: true });
        return;
      } else if(hasExpressed) {
        expressionDiff.remove = [display];
      } else {
        expressionDiff.add = [display];
      }
      this.props.updateVote({ expressions: expressionDiff })
    };  

    const limitEmojiSet = this.props.category.support.express.limitEmojiSet;
    const seenEmojis = new Set<string>();
    const expressionsExpressed:React.ReactNode[] = (this.props.idea.expressions || []).map(expression => {
      if(limitEmojiSet) seenEmojis.add(expression.display);
      return this.renderExpressionEmoji(expression.display, expression.display, getHasExpressed(expression.display), () => clickExpression(expression.display), expression.count);
    });
    const expressionsUnused:React.ReactNode[] = (limitEmojiSet && limitEmojiSet.length !== seenEmojis.size)
      ? limitEmojiSet
          .filter(expression => !seenEmojis.has(expression.display))
          .map(expression => this.renderExpressionEmoji(expression.display, expression.display, getHasExpressed(expression.display), () => clickExpression(expression.display), 0))
      : [];
    const picker = limitEmojiSet ? undefined : (
      <span className={this.props.classes.expressionPicker}><Picker
        key='picker'
        native
        onSelect={emoji => clickExpression(((emoji as BaseEmoji).native) as never)}
        showPreview={false}
        showSkinTones={false}
        emojiSize={16}
        exclude={['recent']}
        style={{
          border: 'unset',
          background: 'unset',
          display: 'block',
        }}
        color={this.props.theme.palette.primary.main}
      /></span>
    );

    const maxItems = 3;
    const summaryItems:React.ReactNode[] = expressionsExpressed.length > 0 ? expressionsExpressed.slice(0, Math.min(maxItems, expressionsExpressed.length)) : [];

    const showMoreButton:boolean = !limitEmojiSet || summaryItems.length !== expressionsExpressed.length + expressionsUnused.length;

    return (
      <div style={{
        position: 'relative',
      }}>
        <div style={{display: 'flex'}}>
          <GradientFade
            disabled={summaryItems.length < maxItems}
            start={'50%'}
            opacity={0.3}
            style={{
              display: 'flex', 
              flexWrap: 'wrap',
            }}
          >
            {summaryItems}
          </GradientFade>
          {showMoreButton && this.renderExpressionEmoji(
            'showMoreButton',
            (
              <span className={this.props.classes.moreContainer}>
                <AddEmojiIcon fontSize='inherit' className={this.props.classes.moreMainIcon} />
                <AddIcon fontSize='inherit' className={this.props.classes.moreAddIcon} />
              </span>
            ),
            false,
            currentTarget => {
              const targetElement = currentTarget.parentElement || currentTarget;
              this.setState({
                expressionExpanded: true,
                expressionExpandedAnchor: {
                  top: targetElement.getBoundingClientRect().top - padding,
                  left: targetElement.getBoundingClientRect().left - padding}
                },
              )
            }
          )}
        </div>
        <Popover
          TransitionComponent={Fade}
          open={!!this.state.expressionExpanded}
          anchorReference='anchorPosition'
          anchorPosition={this.state.expressionExpandedAnchor}
          onClose={() => this.setState({expressionExpanded: false})}
          anchorOrigin={{ vertical: 'top', horizontal: 'left', }}
          transformOrigin={{ vertical: 'top', horizontal: 'left', }}
          marginThreshold={2}
          PaperProps={{
            style: {
              overflow: 'hidden',
              ...(limitEmojiSet ? {} : { width: 'min-content' }),
              borderRadius: '9px',
              padding: padding,
              paddingBottom: limitEmojiSet ? padding : 0,
            }
          }}
          disableRestoreFocus
        >
          {expressionsExpressed}
          {expressionsUnused}
          {picker}
        </Popover>
      </div>
    );
  }

  renderTitle(variant:PostVariant) {
    if(!this.props.idea
      || !this.props.idea.title) return null;
    return (
      <Typography variant='subtitle1'>
        {variant !== 'page' && this.props.display && this.props.display.titleTruncateLines !== undefined && this.props.display.titleTruncateLines > 0
          ? (<Truncate lines={this.props.display.titleTruncateLines}><div>{this.props.idea.title}</div></Truncate>)
          : this.props.idea.title}
      </Typography>
    );
  }

  renderDescription(variant:PostVariant) {
    if(variant !== 'page' && this.props.display && this.props.display.showDescription === false
      || !this.props.idea
      || !this.props.idea.description) return null;
    return (
      <Typography variant='body1'>
        {variant !== 'page' && this.props.display && this.props.display.descriptionTruncateLines !== undefined && this.props.display.descriptionTruncateLines > 0
          ? (<Truncate lines={this.props.display.descriptionTruncateLines}><div>{this.props.idea.description}</div></Truncate>)
          : this.props.idea.description}
      </Typography>
    );
  }

  onExpand() {
    if(!this.props.expandable || !this.props.idea) return;
    if(getCustomTheme(this.props.theme).disableTransitions) {
      this.props.history.push(`/${this.props.server.getProjectId()}/post/${this.props.idea.ideaId}`);
    } else {
      this.expandedPath = `${this.props.match.url}/post/${this.props.idea.ideaId}`;
      Post.expandedPath = this.expandedPath;
      this.props.history.push(this.expandedPath);
    }
  }
}

export default connect<ConnectProps,{},Props,ReduxState>((state:ReduxState, ownProps:Props):ConnectProps => {
  var authorUser, commentsStatus, comments, commentCursor, vote;
  if(ownProps.idea) {
    const user = state.users.byId[ownProps.idea.authorUserId];
    if(!user) {
      ownProps.server.dispatch().userGet({
        projectId: state.projectId,
        userId: ownProps.idea.authorUserId,
      });
    } else {
      authorUser = user.user;
    }
    const commentsByIdeaId = state.comments.byIdeaId[ownProps.idea.ideaId];
    commentsStatus = commentsByIdeaId && commentsByIdeaId.status;
    if(commentsByIdeaId && commentsByIdeaId.status === Status.FULFILLED && commentsByIdeaId.commentIds) {
      commentCursor = commentsByIdeaId.cursor;
      comments = commentsByIdeaId.commentIds.map(commentId => {
        const comment = state.comments.byId[commentId];
        if(!comment || !comment.comment) return undefined;
        if(!comment.comment.authorUserId) return comment.comment;
        const commentAuthorUser = state.users.byId[comment.comment.authorUserId]
        return {...comment.comment, author: commentAuthorUser ? commentAuthorUser.user : undefined};
      });
    }
    const voteResult = state.votes.byIdeaId[ownProps.idea.ideaId];
    if(voteResult === undefined) {
      // Don't refresh votes if inside a panel which will refresh votes for us
      if(ownProps.variant === 'page') {
        ownProps.server.dispatch().voteGetOwn({
          projectId: state.projectId,
          ideaIds: [ownProps.idea.ideaId],
        });
      }
    } else {
      vote = voteResult.vote;
    }
  }
  return {
    configver: state.conf.ver, // force rerender on config change
    projectId: state.projectId,
    authorUser: authorUser,
    vote: vote,
    category: (ownProps.idea && state.conf.conf)
      ? state.conf.conf.content.categories.find(c => c.categoryId === ownProps.idea!.categoryId)
      : undefined,
    credits: state.conf.conf
      ? state.conf.conf.credits
      : undefined,
    maxFundAmountSeen: state.ideas.maxFundAmountSeen,
    loggedInUser: state.users.loggedIn.user,
    commentsStatus: commentsStatus,
    comments: comments,
    commentCursor: commentCursor,
    updateVote: (voteUpdate:Partial<Client.VoteUpdate>):Promise<Client.VoteUpdateResponse> => ownProps.server.dispatch().voteUpdate({
      projectId: state.projectId,
      update: {
        ideaId: ownProps.idea!.ideaId,
        voterUserId: state.users.loggedIn.user!.userId,
        ...voteUpdate,
      },
    }, {previousVote: vote || null}),
  };
})(withStyles(styles, { withTheme: true })(withRouter(withSnackbar(Post))));
