-- ============================================================================
-- SkillCoach redesign — Credits module schema
--
-- Reconstructed from the legacy SocialEngine "Credit" module (Api/Core.php,
-- Model/Balance.php, Model/DbTable/Logs.php, Model/DbTable/ActionTypes.php)
-- and from the live FAQ page, which renders engine4_credit_actiontypes.
--
-- Deviations from legacy are marked  -- NEW:
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Action types — the config surface. One row per way credits move.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `engine4_credit_actiontypes` (
  `action_id`       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `action_type`     VARCHAR(64)  NOT NULL,
  `action_module`   VARCHAR(32)  DEFAULT NULL,   -- NULL = internal (transfers, admin, purchases)
  `action_name`     VARCHAR(128) DEFAULT NULL,   -- human label shown on the FAQ page
  `credit`          INT          NOT NULL DEFAULT 0,   -- awarded per occurrence (negative = costs)
  `max_credit`      INT          NOT NULL DEFAULT 0,   -- cap on SUM(credit) inside the window
  `rollover_period` INT          NOT NULL DEFAULT 0,   -- window length in DAYS; 0 = all-time / never
  `group_type`      VARCHAR(32)  DEFAULT NULL,   -- grouping for admin stats
  `enabled`         TINYINT(1)   NOT NULL DEFAULT 1,   -- NEW: honest off-switch (legacy used credit=0)
  PRIMARY KEY (`action_id`),
  UNIQUE KEY `action_type` (`action_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ----------------------------------------------------------------------------
-- 2. Logs — append-only ledger. Never UPDATE or DELETE a row here.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `engine4_credit_logs` (
  `log_id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       INT UNSIGNED NOT NULL,
  `action_id`     INT UNSIGNED NOT NULL,
  `credit`        INT          NOT NULL,          -- signed: + earned, - spent
  `object_type`   VARCHAR(64)  NOT NULL DEFAULT '',
  `object_id`     INT UNSIGNED NOT NULL DEFAULT 0,
  `body`          TEXT         DEFAULT NULL,      -- free text: order key, gateway name, recipient email
  `creation_date` DATETIME     NOT NULL,
  PRIMARY KEY (`log_id`),
  KEY `throttle` (`user_id`, `action_id`, `creation_date`),  -- serves checkCredit()
  KEY `object`   (`object_type`, `object_id`),               -- serves checkJoin()/checkLike()
  KEY `history`  (`user_id`, `log_id`)                       -- serves the transaction list
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ----------------------------------------------------------------------------
-- 3. Balances — denormalised running totals. balance_id IS the user_id.
--
--    current_credit = spendable now
--    earned_credit  = lifetime in   (only grows)
--    spent_credit   = lifetime out  (only grows)
--
--    Legacy invariant: current == earned - spent, EXCEPT after an admin
--    "set credits", which overwrites current and leaves the lifetime totals
--    untouched on purpose (Balance::settingCredits).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `engine4_credit_balances` (
  `balance_id`     INT UNSIGNED NOT NULL,        -- = engine4_users.user_id
  `current_credit` INT NOT NULL DEFAULT 0,
  `earned_credit`  INT NOT NULL DEFAULT 0,
  `spent_credit`   INT NOT NULL DEFAULT 0,
  `modified_date`  DATETIME DEFAULT NULL,        -- NEW: useful, legacy had no timestamp
  PRIMARY KEY (`balance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================================
-- SEED — earning rules
-- Values copied verbatim from the live FAQ page. Modules SkillCoach does not
-- run (album, blog, classified, event, forum, music, page, poll, rate, video)
-- are deliberately omitted.
-- ============================================================================

INSERT INTO `engine4_credit_actiontypes`
  (`action_type`, `action_module`, `action_name`, `credit`, `max_credit`, `rollover_period`, `group_type`) VALUES

-- Core -----------------------------------------------------------------------
('signup',                'core', 'Sign up',                         20,   0, 0, 'earning'),
('user_login',            'core', 'Sign in',                          1, 100, 1, 'earning'),
('friend_make',           'core', 'New friendship',                   5, 100, 1, 'earning'),
('user_profile_edit',     'core', 'Edit user''s profile',             1,  10, 1, 'earning'),
('core_like',             'core', 'Like photos, videos, pages, etc',  1, 100, 1, 'earning'),
('core_comment',          'core', 'Comment photos, videos, etc',      1, 100, 1, 'earning'),
('activity_like',         'core', 'Like posts on wall',               1, 100, 1, 'earning'),
('activity_comment',      'core', 'Comment posts on wall',            1, 100, 1, 'earning'),
('core_link',             'core', 'Share link on wall',               1, 100, 1, 'earning'),
('status',                'core', 'Share your status on wall',        1, 100, 1, 'earning'),
('share_post_facebook',   'core', 'Share post on facebook',           1, 100, 1, 'earning'),
('share_post_twitter',    'core', 'Share post on twitter',            1, 100, 1, 'earning'),
('share_post_linkedin',   'core', 'Share post on linkedin',           1, 100, 1, 'earning'),

-- Group (SkillCoach projects / groups) ---------------------------------------
('group_create',          'group', 'Create a group',                 10, 100, 1, 'earning'),
('group_join',            'group', 'Join a group',                    5, 100, 1, 'earning'),
('group_topic_create',    'group', 'Create a topic in a group',       3, 100, 1, 'earning'),
('group_post_create',     'group', 'Post a message in a group topic', 2, 100, 1, 'earning'),
('group_photo_upload',    'group', 'Upload a photo in a group',       2, 100, 1, 'earning'),
('group_shared_lesson',   'group', 'Share a lesson',                  2, 100, 1, 'earning'),

-- Inviter ---------------------------------------------------------------------
('refer',                 'inviter', 'Refer friends (on sign up)',    5, 100, 1, 'earning'),
('invite',                'inviter', 'Invite friends',                1, 100, 1, 'earning');


-- ============================================================================
-- SEED — internal action types
-- action_module IS NULL so they always resolve, are never throttled, and never
-- appear on the FAQ page. credit = 0 because the amount is passed at runtime.
-- ============================================================================

INSERT INTO `engine4_credit_actiontypes`
  (`action_type`, `action_module`, `action_name`, `credit`, `max_credit`, `rollover_period`, `group_type`) VALUES

-- Member-to-member transfers (paired rows: sender negative, recipient positive)
('transfer_to',            NULL, 'Transfer to someone',        0, 0, 0, 'transfer'),
('transfer_from',          NULL, 'Transfer from someone',      0, 0, 0, 'transfer'),
('transfer_to_bynotes',    NULL, 'Paid for notes',             0, 0, 0, 'transfer'),
('transfer_from_bynotes',  NULL, 'Received for notes',         0, 0, 0, 'transfer'),

-- Admin
('give_credits',           NULL, 'Credits given by admin',     0, 0, 0, 'admin'),
('set_credits',            NULL, 'Balance set by admin',       0, 0, 0, 'admin'),

-- Purchases and spending
('buy_credits',            NULL, 'Bought credits',             0, 0, 0, 'purchase'),
('buy_level',              NULL, 'Bought a membership level',  0, 0, 0, 'spending'),
('buy_offer',              NULL, 'Bought an offer',            0, 0, 0, 'spending'),
('buy_products',           NULL, 'Bought products',            0, 0, 0, 'spending'),
('cancel_order',           NULL, 'Order cancelled — refunded', 0, 0, 0, 'spending'),
('send_gift',              NULL, 'Sent a gift',                0, 0, 0, 'spending');


-- ============================================================================
-- Backfill a zero balance row for every existing user.
-- (The service layer also creates rows lazily, so this is just tidiness.)
-- ============================================================================
INSERT IGNORE INTO `engine4_credit_balances` (`balance_id`, `current_credit`, `earned_credit`, `spent_credit`)
SELECT `user_id`, 0, 0, 0 FROM `engine4_users`;