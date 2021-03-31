import axios from "axios";
import Cookies from "next-cookies";
import Router from "next/router";
import React, { useRef, useState } from "react";
import tokenConfig from "../public/config/tokenConfig";
import { blobFromObjectUrl, getImageUrl } from "../public/lib/imageOperations";
import { indicateWrongLocation, isLocationValid } from "../public/lib/locationOperations";
import { parseOptions } from "../public/lib/selectOptionsOperations";
import LoginNudge from "../src/components/general/LoginNudge";
import PageNotFound from "../src/components/general/PageNotFound";
import WideLayout from "../src/components/layouts/WideLayout";
import profile_info_metadata from "./../public/data/profile_info_metadata";
import { parseProfile } from "./../public/lib/profileOperations";
import EditAccountPage from "./../src/components/account/EditAccountPage";

export default function EditProfilePage({
  skillsOptions,
  availabilityOptions,
  infoMetadata,
  user,
  token,
}) {
  const [errorMessage, setErrorMessage] = useState("");
  const locationInputRef = useRef(null);
  const [locationOptionsOpen, setLocationOptionsOpen] = useState(false);

  const handleSetLocationOptionsOpen = (newValue) => {
    setLocationOptionsOpen(newValue);
  };

  //add dynamic data to the data retrieved from profile_info_metadata.js
  infoMetadata = {
    ...infoMetadata,
    availability: {
      ...infoMetadata.availability,
      options: availabilityOptions,
    },
    location: {
      ...infoMetadata.location,
      locationOptionsOpen: locationOptionsOpen,
      setLocationOptionsOpen: handleSetLocationOptionsOpen,
      locationInputRef: locationInputRef,
    },
  };
  const profile = user ? parseProfile(user, true) : null;
  const legacyModeEnabled = process.env.ENABLE_LEGACY_LOCATION_FORMAT === "true";
  const saveChanges = async (editedAccount) => {
    if (
      editedAccount?.info?.location === user?.info?.location &&
      !isLocationValid(editedAccount?.info?.location) &&
      !legacyModeEnabled
    ) {
      indicateWrongLocation(locationInputRef, handleSetLocationOptionsOpen, setErrorMessage);
      return;
    }
    const parsedProfile = parseProfileForRequest(editedAccount, availabilityOptions, user);
    const payload = await getProfileWithoutRedundantOptions(user, parsedProfile);
    axios
      .post(process.env.API_URL + "/api/edit_profile/", payload, tokenConfig(token))
      .then(function (response) {
        Router.push({
          pathname: "/profiles/" + response.data.url_slug,
          query: {
            message: "You have successfully updated your profile!",
          },
        });
      })
      .catch(function (error) {
        console.log(error);
        if (error && error.reponse) console.log(error.response);
      });
  };
  const handleCancel = () => {
    Router.push("/profiles/" + profile.url_slug);
  };
  if (!profile)
    return (
      <WideLayout title="Please Log In to Edit your Profile" hideHeadline={true}>
        <LoginNudge fullPage whatToDo="edit your profile" />
      </WideLayout>
    );
  else
    return (
      <WideLayout
        title={"Edit Profile"}
        message={errorMessage}
        messageType={errorMessage && "error"}
      >
        {profile ? (
          <ProfileLayout
            profile={profile}
            infoMetadata={infoMetadata}
            handleSubmit={saveChanges}
            handleCancel={handleCancel}
            skillsOptions={skillsOptions}
          />
        ) : (
          <PageNotFound itemName="Profile" />
        )}
      </WideLayout>
    );
}

EditProfilePage.getInitialProps = async (ctx) => {
  const { token } = Cookies(ctx);
  const [skillsOptions, infoMetadata, availabilityOptions, userProfile] = await Promise.all([
    getSkillsOptions(token),
    getProfileInfoMetadata(token),
    getAvailabilityOptions(token),
    getUserProfile(token),
  ]);
  return {
    skillsOptions: skillsOptions,
    infoMetadata: infoMetadata,
    availabilityOptions: availabilityOptions,
    token: token,
    user: userProfile,
  };
};

function ProfileLayout({
  profile,
  profileTypes,
  infoMetadata,
  maxAccountTypes,
  handleSubmit,
  handleCancel,
  skillsOptions,
}) {
  return (
    <EditAccountPage
      account={profile}
      deleteEmail="support@climateconnect.earth"
      handleCancel={handleCancel}
      handleSubmit={handleSubmit}
      infoMetadata={infoMetadata}
      maxAccountTypes={maxAccountTypes}
      possibleAccountTypes={profileTypes}
      skillsOptions={skillsOptions}
      splitName
      type="profile"
    />
  );
}

async function getSkillsOptions(token) {
  try {
    const resp = await axios.get(process.env.API_URL + "/skills/", tokenConfig(token));
    if (resp.data.results.length === 0) return null;
    else {
      return parseOptions(resp.data.results, "parent_skill");
    }
  } catch (err) {
    console.log(err);
    if (err.response && err.response.data) console.log("Error: " + err.response.data.detail);
    return null;
  }
}

async function getAvailabilityOptions(token) {
  try {
    const resp = await axios.get(process.env.API_URL + "/availability/", tokenConfig(token));
    if (resp.data.results.length === 0) return null;
    else {
      return resp.data.results;
    }
  } catch (err) {
    console.log(err);
    if (err.response && err.response.data) console.log("Error: " + err.response.data.detail);
    return null;
  }
}

async function getUserProfile(token) {
  try {
    const resp = await axios.get(process.env.API_URL + "/api/edit_profile/", tokenConfig(token));
    return resp.data;
  } catch (err) {
    console.log(err);
    if (err.response && err.response.data) console.log("Error: " + err.response.data.detail);
    return null;
  }
}

async function getProfileInfoMetadata() {
  return profile_info_metadata;
}

const parseProfileForRequest = (profile, availabilityOptions, user) => {
  const availability = availabilityOptions.find((o) => o.name == profile.info.availability);
  const image = profile.image;
  const thumbnail = profile.thumbnail_image;
  const background = profile.background_image;
  return {
    first_name: profile.first_name,
    last_name: profile.last_name,
    image: image,
    thumbnail_image: thumbnail,
    background_image: background,
    country: profile.info.country,
    location: profile.info.location,
    biography: profile.info.bio,
    availability: availability ? availability.id : user.availability ? user.availability.id : null,
    skills: profile.info.skills.map((s) => s.id),
    website: profile.info.website,
  };
};

const getProfileWithoutRedundantOptions = async (user, newProfile) => {
  const oldProfile = {
    ...user,
    skills: user.skills.map((s) => s.id),
    image: getImageUrl(user.image),
    thumbnail_image: getImageUrl(user.thumbnail_image),
    background_image: getImageUrl(user.background_image),
    availability: user.availability && user.availability.id,
  };
  console.log(oldProfile);
  console.log(newProfile);
  const finalProfile = {};
  Object.keys(newProfile).map((k) => {
    if (
      oldProfile[k] &&
      newProfile[k] &&
      Array.isArray(oldProfile[k]) &&
      Array.isArray(newProfile[k])
    ) {
      if (!arraysEqual(oldProfile[k], newProfile[k])) finalProfile[k] = newProfile[k];
    } else if (oldProfile[k] !== newProfile[k] && !(!oldProfile[k] && !newProfile[k]))
      finalProfile[k] = newProfile[k];
  });
  if (finalProfile.image) finalProfile.image = await blobFromObjectUrl(finalProfile.image);
  if (finalProfile.thumbnail_image)
    finalProfile.thumbnail_image = await blobFromObjectUrl(finalProfile.thumbnail_image);
  if (finalProfile.background_image)
    finalProfile.background_image = await blobFromObjectUrl(finalProfile.background_image);
  return finalProfile;
};

function arraysEqual(_arr1, _arr2) {
  if (!Array.isArray(_arr1) || !Array.isArray(_arr2) || _arr1.length !== _arr2.length) return false;

  var arr1 = _arr1.concat().sort();
  var arr2 = _arr2.concat().sort();
  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }

  return true;
}
