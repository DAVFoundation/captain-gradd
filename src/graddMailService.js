const email = require('./lib/email');

const GRADD_FROM = process.env.GRADD_FROM || `DAV Foundation`;
const GRADD_TO = process.env.GRADD_TITLE || `hai@dav.network`;
const GRADD_TITLE = process.env.GRADD_TITLE || `New DAV contract received`;
const GRADD_BODY = process.env.GRADD_BODY || `Gradd body\n\n`;
const MISSION_PARAM_NAME = process.env.MISSION_PARAM_NAME || `mission`;
const SCHEME = process.env.SCHEME || 'https';
const DOMAIN = process.env.DOMAIN || 'missions.io';
const DUMMY_MISSION = {
  mission_id        : 'AAAA1111',
  pickup_latitude   : 0,
  pickup_longitude  : 0,
  pickup_altitude   : 0,
  pickup_heading    : 0,
  pickup_distance   : 0,
  dropoff_latitude  : 10,
  dropoff_longitude : 10,
  dropoff_altitude  : 0,
  coordinates       : []
};

const buildMissionParamFromMission = (mission_param) => {
  //todo: build json with initial coords
  let mission = mission_param || DUMMY_MISSION;
  let param = {};
  param.mission_id = mission.mission_id;
  param.captain_id = mission.captain_id;
  param.pickup_latitude = mission.start_latitude;
  param.pickup_longitude = mission.start_longitude;
  param.pickup_altitude = 0;
  param.pickup_heading = 0;
  param.pickup_distance = 0;
  param.dropoff_latitude = mission.end_latitude;
  param.dropoff_longitude = mission.end_longitude;
  param.dropoff_altitude = 0;
  param.coordinates = [];
  let paramBase64 = Buffer.from( JSON.stringify(param) ).toString('base64');
  return paramBase64;
};

const buildLinkToGraddForm = mission => {
  let missionParamBase64 = encodeURIComponent(buildMissionParamFromMission(mission));
  let routeCreatorURL = `${SCHEME}://${DOMAIN}/html/route-creator.html?${MISSION_PARAM_NAME}=${missionParamBase64}`;
  let link = `<a href="${routeCreatorURL}">Press Here to input route</a><br/>\n
    If the above link does not work, copy and paste the following into your browser:<br/>\n
    ${routeCreatorURL}`;
  return link;
};
const emailGraddStatusPayloadRequest = async (mission) => {
  let gradd_body = GRADD_BODY + `<br/>\n` + buildLinkToGraddForm(mission);
  return await email.mail(GRADD_FROM, GRADD_TO, GRADD_TITLE, gradd_body);
};

module.exports = {
  emailGraddStatusPayloadRequest,
  buildMissionParamFromMission
};