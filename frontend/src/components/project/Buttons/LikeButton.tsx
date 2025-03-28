import { Button, CircularProgress, IconButton, Link, Typography, useTheme } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { Theme } from "@mui/material/styles";
import React, { MouseEventHandler } from "react";
import ButtonIcon from "../../general/ButtonIcon";

type MakeStylesProps = {
  likingChangePending: boolean;
  isUserLiking: boolean;
};

const useStyles = makeStyles((theme: Theme) => ({
  largeScreenButtonContainer: {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
  },
  likesLink: {
    cursor: "pointer",
    textAlign: "center",
  },
  largeLikeButton: {
    height: 40,
    maxWidth: 120,
    "&:disabled": {
      color: "white",
      background: theme.palette.secondary.main,
    },
  },
  likeNumber: {
    fontWeight: 700,
  },
  likeNumberMobile: {
    fontWeight: 600,
    color: theme.palette.text.primary,
    whiteSpace: "nowrap",
  },
  likesText: {
    fontWeight: 500,
    fontSize: 18,
  },
  mediumScreenIconButton: {
    height: 40,
  },
  mobileButtonContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    cursor: "pointer",
    height: 40,
  },
  iconButton: {
    padding: theme.spacing(1),
    "&:hover": {
      background: "none",
    },
  },
  fabProgress: {
    color: "white",
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: "auto",
    marginBottom: "auto",
  },
  buttonLabel: {
    position: "relative",
  },
  buttonText: (props: MakeStylesProps) => ({
    visibility: props.likingChangePending ? "hidden" : "visible",
    color: props.isUserLiking
      ? theme.palette.secondary.contrastText
      : theme.palette.primary.contrastText,
  }),
  hidden: {
    visibility: "hidden",
  },
  //Weird naming
  buttonAfterLike: (props: MakeStylesProps) => ({
    backgroundColor: props.isUserLiking ? theme.palette.secondary.main : theme.palette.primary.main,
    color: theme.palette.background.default,
  }),
}));

type Args = {
  isUserLiking: boolean;
  handleToggleLikeProject: MouseEventHandler<HTMLButtonElement>;
  texts: any;
  toggleShowLikes: MouseEventHandler<HTMLAnchorElement>;
  likingChangePending: boolean;
  hasAdminPermissions?: boolean;
  screenSize?: any;
  numberOfLikes: number;
  bindLike?: Function;
};

export default function LikeButton({
  isUserLiking,
  handleToggleLikeProject,
  texts,
  toggleShowLikes,
  likingChangePending,
  hasAdminPermissions = false,
  screenSize,
  numberOfLikes,
  bindLike,
}: Args) {
  const classes = useStyles({
    likingChangePending: likingChangePending,
    isUserLiking: isUserLiking,
  });
  const theme = useTheme();
  //Small screens
  if (screenSize?.belowSmall) {
    return (
      <span
        className={classes.mobileButtonContainer}
        onClick={handleToggleLikeProject}
        {...bindLike}
      >
        <IconButton className={`${classes.iconButton}`} disabled={likingChangePending} size="large">
          <ButtonIcon
            icon="like"
            size={40}
            color={isUserLiking ? "earth" : theme.palette.background.default_contrastText}
          />
        </IconButton>
        {numberOfLikes > 0 && (
          <Typography className={classes.likeNumberMobile}>• {numberOfLikes}</Typography>
        )}
      </span>
    );
    //Medium screens
  } else if (screenSize?.belowMedium && !screenSize.belowSmall && !hasAdminPermissions) {
    return (
      <span className={classes.largeScreenButtonContainer}>
        <IconButton
          onClick={handleToggleLikeProject}
          disabled={likingChangePending}
          className={`${classes.mediumScreenIconButton}`}
          size="large"
        >
          <ButtonIcon
            icon="like"
            size={40}
            color={isUserLiking ? "earth" : theme.palette.primary.main}
          />
        </IconButton>
        {numberOfLikes > 0 && (
          <Link
            color="secondary"
            className={classes.likesLink}
            underline="none"
            onClick={toggleShowLikes}
          >
            <Typography className={classes.likesText}>
              <span className={classes.likeNumber}>{numberOfLikes} </span>
              {numberOfLikes > 1 ? texts.likes : texts.one_like}
            </Typography>
          </Link>
        )}
      </span>
    );
    //Large screens
  } else {
    return (
      <span className={classes.largeScreenButtonContainer}>
        <Button
          onClick={handleToggleLikeProject}
          variant="contained"
          startIcon={
            <ButtonIcon
              icon="like"
              size={26}
              color={isUserLiking ? "earth" : theme.palette.primary.contrastText}
            />
          }
          disabled={likingChangePending}
          color={isUserLiking ? "secondary" : "primary"}
          className={classes.largeLikeButton}
        >
          <div className={classes.buttonLabel}>
            <CircularProgress
              size={20}
              className={`${classes.fabProgress} ${!likingChangePending && classes.hidden}`}
            />
            <div className={classes.buttonText}>{isUserLiking ? texts.liked : texts.like}</div>
          </div>
        </Button>
        {numberOfLikes > 0 && (
          <Link
            color="text.primary"
            className={classes.likesLink}
            underline="none"
            onClick={toggleShowLikes}
          >
            <Typography className={classes.likesText}>
              <span className={classes.likeNumber}>{numberOfLikes} </span>
              {numberOfLikes > 1 ? texts.likes : texts.one_like}
            </Typography>
          </Link>
        )}
      </span>
    );
  }
}
