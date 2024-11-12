const logLevels = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  http: 'http',
  debug: 'debug',
  silly: 'silly',
};

const middlewareLogLevels = {
  info: 'info',
  debug: 'debug',
  silly: 'silly',
};

const adminRoles = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  EDITOR: 'editor',
};

const adminActions = {
  BAN_USER: 'banUsers',
  EXPORT_VIDEO: 'exportVideos',
  VIEW_USERS: 'viewUsers',
  CREATE_USER: 'createUser',
  DELETE_USER: 'deleteUser',
  ASSIGN_USER_ROLE: 'assignUserRole',
  UPLOAD_STICKERS: 'uploadStickers',

  VIEW_REPORTED_CONTENT: 'viewReportedContent',
  EDIT_REPORTED_CONTENT: 'removeReportedContent',

  VIEW_BLOCKED_USERS: 'viewBlockedUsers',
  EDIT_BLOCKED_USERS: 'editBlockedUsers',

  VIEW_BOTS : "viewBots",
  CREATE_BOTS : "createBots"

};

const adminRolesToActions = {
  [adminRoles.ADMIN]: [
    adminActions.UPLOAD_STICKERS,
    adminActions.BAN_USER,
    adminActions.VIEW_USERS,
    adminActions.CREATE_USER,
    adminActions.DELETE_USER,
    adminActions.ASSIGN_USER_ROLE,
    adminActions.VIEW_REPORTED_CONTENT,
    adminActions.EDIT_REPORTED_CONTENT,
    adminActions.VIEW_BLOCKED_USERS,
    adminActions.EDIT_BLOCKED_USERS,
    adminActions.VIEW_BOTS,
    adminActions.CREATE_BOTS
  ],

  [adminRoles.MODERATOR]: [
    adminActions.VIEW_REPORTED_CONTENT,
    adminActions.EDIT_REPORTED_CONTENT,
    adminActions.VIEW_BLOCKED_USERS,
    adminActions.EDIT_BLOCKED_USERS,
  ],

  [adminRoles.EDITOR]: [
  ],
};

export { logLevels, middlewareLogLevels, adminRoles, adminActions, adminRolesToActions };
