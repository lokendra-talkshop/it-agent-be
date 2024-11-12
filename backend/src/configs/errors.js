export const otpErrors = {
  invalidOtp: {
    code: 'invalid_otp',
    message: 'Invalid OTP',
    description: 'The OTP you entered is invalid. Please try again.',
  },
};

export const botErrors = {
  botNotFound: {
    code: 'bot_not_found',
    message: 'Bot not found',
    description: 'Bot with the given id does not exist.',
  },

}

export const conversationErrors = {
  conversationNotFound: {
    code: 'conversation_not_found',
    message: 'Conversation not found',
    description: 'A Conversation with the given id does not exist.',
  },

}

export const clipBoardErrors = {
   invalidEntryId : {
      code : 'invalid_entry_id',
      message : "Invalid entry Id for user",
      description : "When a entry id can not be found for the given user"
   }
}

export const messageErrors = {
  messageNotFound: {
    code: 'message_not_found',
    message: 'Message not found',
    description: 'A Message with the given id does not exist.',
  },
  
}

export const urlErrors = {
  presignedUrlNotFound: {
    code: 'presigned_url_not_found',
    message: 'Url not found',
    description: 'Can not find presigned_url for the given id',
  },
};

export const userErrorCodes = {
  userNotFound: {
    code: 'user_not_found',
    message: 'User not found',
    description: 'User with the given phone number does not exist.',
  },
  usersOnboardingNotFound: {
    code: 'user_onboarding_not_found',
    message: 'User onboarding not found',
    description: 'User onboarding with the given user does not exist.',
  },
  userInterestNotFound: {
    code: 'user_interest_not_found',
    message: 'Interest not found',
    description: 'Interest with the user does not exist.',
  },
  userHasBeenBlocked: {
    code: 'user_has_been_blocked',
    message: 'User has been blocked',
    description: 'User has been blocked',
  },
  blockedByYou: {
    code: 'user_has_been_blocked_by_you',
    message: 'You have blocked the user',
    description: 'Blocked by you',
  },

  cannotBlockSelf: {
    code: 'cannot_block_self',
    message: 'Cannot block self',
    description: 'Cannot block self',
  },
};

export const validationErrors = {
  stickerStillActive: {
    code: 'sticker_still_active',
    message: 'The requested sticker is still active',
    description: 'You can only delete an disactivated sticker',
  },

  stickerNotFound: {
    code: 'sticker_not_found',
    message: 'No sticker found matching your requst',
    description: 'When invalid sticker ids are put into the system and cant be found',
  },

  greenScreenBackgroundNotFound: {
    code: 'green_screen_background_not_found',
    message: 'No green screen background found matching your request',
    description: 'When invalid green scree background ids are put into the system and cant be found',
  },

  greenScreenBackgroundStillActive: {
    code: 'green_screen_background_still_active',
    message: 'The requested green screen background is still active',
    description: 'When invalid green scree background ids are put into the system and cant be found',
  },

  invalidInput: {
    code: 'invalid_input',
    message: 'Invalid input',
    description: 'Invalid input',
  },
  userNotCreator: {
    code: 'user_not_creator',
    message: 'User is not the creator of the post',
    description: 'The user performing the action is not the creator of the post',
  },
  resourceNotFound: {
    code: 'resource_not_found',
    message: 'Resource not found',
    description: 'Resource not found',
  },
  connectionsNotFound: {
    code: 'connections_not_found',
    message: 'Connections not found',
    description: 'Connections not found',
  },
  otherUserNotFound: {
    code: 'other_user_not_found',
    message: 'Other user not found',
    description: 'Other user not found',
  },
  videoNotCreated: {
    code: 'video_not_created',
    message: 'Video not created',
    description: 'Video not created',
  },
  connectionRequestExists: {
    code: 'connection_request_exists',
    message: 'Connection request exists',
    description: 'Connection request exists',
  },
  userNotFollowing: {
    code: 'user_not_following',
    message: 'You are not following this user',
    description: 'User is not following the user',
  },
  usersAlreadyConnected: {
    code: 'users_already_connected',
    message: 'Users already connected',
    description: 'Users already connected',
  },
  resourceAlreadyProcessed: {
    code: 'resource_already_processed',
    message: 'Resource already processed',
    description: 'Resource already processed',
  },
  blockingUserIsBlockedUser: {
    code: 'blocking_user_is_blocked_user',
    message: 'Blocking user is blocked user',
    description: 'Blocking user is blocked user',
  },
  questionTooLong: {
    code: 'question_too_long',
    message: 'Question is too long',
    description: 'Question length must not exceed 100 characters',
  },
  cannotDeletePublishedPost: {
    code: 'cannot_delete_published_post',
    message: 'Cannot delete published post',
    description: 'This post is published already. Cannot delete it now.',
  },
  postIsDeleted: {
    code: 'post_is_deleted',
    message: 'Post is deleted',
    description: 'Post is deleted.',
  },
  invalidFlair: {
    code: 'invalid_flair',
    message: 'Invalid flair',
    description: 'Invalid flair.',
  },
  searchTooShort: {
    code: 'search_too_short',
    message: 'Search query is too short',
    description: 'Search query must be at least 4 characters long',
  },
};

export const forbiddenErrors = {
  forbiddenUser: {
    code: 'forbidden_user',
    message: 'User is forbidden',
    description: 'User is forbidden',
  },
};
