import { Link, Typography } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import NextCookies from "next-cookies";
import React, { useContext } from "react";
import ROLE_TYPES from "../../public/data/role_types";
import { apiRequest, getLocalePrefix, sendToLogin } from "../../public/lib/apiOperations";
import {
  getProjectTagsOptions,
  getProjectTypeOptions,
  getSkillsOptions,
  getStatusOptions,
} from "../../public/lib/getOptions";
import { getImageUrl } from "../../public/lib/imageOperations";
import { nullifyUndefinedValues } from "../../public/lib/profileOperations";
import getTexts from "../../public/texts/texts";
import UserContext from "../../src/components/context/UserContext";
import EditProjectRoot from "../../src/components/editProject/EditProjectRoot";
import LoginNudge from "../../src/components/general/LoginNudge";
import Layout from "../../src/components/layouts/layout";
import WideLayout from "../../src/components/layouts/WideLayout";
import getHubTheme from "../../src/themes/fetchHubTheme";
import { transformThemeData } from "../../src/themes/transformThemeData";

const useStyles = makeStyles((theme) => ({
  root: {
    textAlign: "center",
  },
  errorTitle: {
    textAlign: "center",
    marginTop: theme.spacing(8),
  },
}));

export async function getServerSideProps(ctx) {
  const { auth_token } = NextCookies(ctx);
  const texts = getTexts({ page: "project", locale: ctx.locale });
  if (ctx.req && !auth_token) {
    const message = texts.please_log_in_to_edit_project;
    return sendToLogin(ctx, message);
  }
  const projectUrl = encodeURI(ctx.query.projectUrl);
  const hubUrl = ctx.query.hub;
  const [
    project,
    members,
    skillsOptions,
    userOrganizations,
    statusOptions,
    tagsOptions,
    projectTypeOptions,
    hubThemeData,
  ] = await Promise.all([
    getProjectByIdIfExists(projectUrl, auth_token, ctx.locale),
    getMembersByProject(projectUrl, auth_token, ctx.locale),
    getSkillsOptions(ctx.locale),
    getUserOrganizations(auth_token, ctx.locale),
    getStatusOptions(ctx.locale),
    getProjectTagsOptions(null, ctx.locale),
    getProjectTypeOptions(ctx.locale),
    getHubTheme(hubUrl),
  ]);
  return {
    props: nullifyUndefinedValues({
      project: project,
      members: members,
      skillsOptions: skillsOptions,
      userOrganizations: userOrganizations,
      statusOptions: statusOptions,
      tagsOptions: tagsOptions,
      projectTypeOptions: projectTypeOptions,
      hubThemeData: hubThemeData,
      hubUrl: hubUrl,
    }),
  };
}

export default function EditProjectPage({
  project,
  members,
  skillsOptions,
  userOrganizations,
  statusOptions,
  tagsOptions,
  projectTypeOptions,
  hubThemeData,
  hubUrl,
}) {
  const classes = useStyles();
  const [curProject, setCurProject] = React.useState({
    ...project,
    status: statusOptions.find((s) => s.name === project?.status),
    hubUrl: project.related_hubs?.length > 0 ? project.related_hubs[0] : null,
  });
  project = {
    ...project,
    status: statusOptions.find((s) => s.name === project?.status),
  };
  const [errorMessage, setErrorMessage] = React.useState("");
  const { user, locale, CUSTOM_HUB_URLS } = useContext(UserContext);
  const isCustomHub = CUSTOM_HUB_URLS.includes(hubUrl);
  const texts = getTexts({ page: "project", locale: locale });

  const handleSetErrorMessage = (newErrorMessage) => {
    setErrorMessage(newErrorMessage);
  };
  const handleSetProject = (newProject) => {
    setCurProject({ ...newProject });
  };
  if (!user)
    return (
      <WideLayout
        title={texts.please_log_in_to_edit_project}
        headerBackground={hubUrl === "prio1" ? "#7883ff" : "#FFF"}
        customTheme={hubThemeData ? transformThemeData(hubThemeData) : undefined}
        hubUrl={hubUrl}
      >
        <LoginNudge fullPage whatToDo={texts.to_edit_this_project} />
      </WideLayout>
    );
  else if (!project)
    return (
      <Layout className={classes.root} title={texts.project_not_found}>
        <Typography className={classes.errorTitle} variant="h3">
          {texts.project_does_not_exist}{" "}
          <Link href={getLocalePrefix(locale) + "/share"} underline="hover">
            {texts.click_here}
          </Link>{" "}
          {texts.to_create_a_project}
        </Typography>
      </Layout>
    );
  else if (!members.find((m) => m.user && m.user.id === user.id))
    return (
      <WideLayout
        title={texts.not_a_member}
        headerBackground={hubUrl === "prio1" ? "#7883ff" : "#FFF"}
        customTheme={hubThemeData ? transformThemeData(hubThemeData) : undefined}
        hubUrl={hubUrl}
      >
        <Typography variant="h4" color="primary" className={classes.errorTitle}>
          {texts.not_a_member}. {texts.go_to_the}{" "}
          <a href={getLocalePrefix(locale) + "/projects/" + project.url_slug}>
            {texts.project_page}
          </a>{" "}
          {texts.and_ask_to_be_part_of_the_team}
        </Typography>
      </WideLayout>
    );
  else if (
    members.find((m) => m.user && m.user.id === user.id).role.role_type != ROLE_TYPES.all_type &&
    members.find((m) => m.user && m.user.id === user.id).role.role_type !=
      ROLE_TYPES.read_write_type
  )
    return (
      <WideLayout
        title={texts.no_permissions_to_edit_project}
        headerBackground={hubUrl === "prio1" ? "#7883ff" : "#FFF"}
        customTheme={hubThemeData ? transformThemeData(hubThemeData) : undefined}
        hubUrl={hubUrl}
      >
        <Typography variant="h4" color="primary" className={classes.errorTitle}>
          {texts.need_to_be_admin_to_manage_project_team}
        </Typography>
      </WideLayout>
    );
  else {
    const user_role = members.find((m) => m.user && m.user.id === user.id).role;
    return (
      <WideLayout
        title={texts.edit_project + " " + project.name}
        message={errorMessage}
        messageType={errorMessage && "error"}
        headerBackground={hubUrl === "prio1" ? "#7883ff" : "#FFF"}
        customTheme={hubThemeData ? transformThemeData(hubThemeData) : undefined}
        hubUrl={hubUrl}
      >
        <EditProjectRoot
          oldProject={project}
          project={curProject}
          skillsOptions={skillsOptions}
          userOrganizations={userOrganizations}
          statusOptions={statusOptions}
          handleSetProject={handleSetProject}
          tagsOptions={tagsOptions}
          user_role={user_role}
          handleSetErrorMessage={handleSetErrorMessage}
          initialTranslations={project.translations}
          projectTypeOptions={projectTypeOptions}
        />
      </WideLayout>
    );
  }
}

async function getProjectByIdIfExists(projectUrl, token, locale) {
  try {
    const resp = await apiRequest({
      method: "get",
      url: "/api/projects/" + projectUrl + "/?edit_view=true",
      token: token,
      locale: locale,
    });
    if (resp.data.length === 0) return null;
    else {
      return parseProject(resp.data);
    }
  } catch (err: any) {
    console.log(err);
    if (err.response && err.response.data) console.log("Error: " + err.response.data.detail);
    return null;
  }
}

const parseProject = (project) => ({
  ...project,
  image: getImageUrl(project.image),
  tags: project.tags.map((t) => t.project_tag),
  project_parents: project.project_parents[0],
  is_personal_project: !project.project_parents[0].parent_organization,
  skills: project.skills.map((s) => ({ ...s, key: s.id })),
});

const getUserOrganizations = async (token, locale) => {
  try {
    const resp = await apiRequest({
      method: "get",
      url: "/api/my_organizations/",
      token: token,
      locale: locale,
    });
    if (resp.data.length === 0) return null;
    else {
      return resp.data.map((o) => o.organization);
    }
  } catch (err: any) {
    console.log(err);
    if (err.response && err.response.data) console.log("Error: " + err.response.data.detail);
    return null;
  }
};

async function getMembersByProject(projectUrl, token, locale) {
  try {
    const resp = await apiRequest({
      method: "get",
      url: "/api/projects/" + projectUrl + "/members/",
      token: token,
      locale: locale,
    });
    if (!resp.data) return null;
    else {
      return resp.data.results;
    }
  } catch (err: any) {
    console.log(err);
    if (err.response && err.response.data) console.log("Error: " + err.response.data.detail);
    return null;
  }
}
