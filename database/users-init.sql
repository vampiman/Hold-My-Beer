create extension citext;
create table users (
  name varchar(15) unique not null,
  email citext unique not null,
  hash varchar(60) not null, -- bcrypt hash
  avatar uuid not null default (uuid('00000000-0000-0000-0000-000000000000')),
  creation timestamp default (now() at time zone 'utc') not null,
  id serial primary key unique,
  language varchar(20)
);
create table user_sessions (
  "sid" varchar not null collate "default",
  "sess" json not null,
  "expire" timestamp(6) not null
) with (oids=false);
alter table user_sessions add constraint "session_pkey" primary key ("sid") not deferrable initially immediate;
