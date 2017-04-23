create extension citext;
create table users (
  name varchar(15) unique not null,
  email citext unique not null,
  avatar varchar(32), -- MD5 hash of the image for deduping and storage on filesystem
  hash varchar(60) not null, -- bcrypt hash
  id serial primary key
);
create table user_sessions (
  "sid" varchar not null collate "default",
  "sess" json not null,
  "expire" timestamp(6) not null
) with (oids=false);
alter table user_sessions add constraint "session_pkey" primary key ("sid") not deferrable initially immediate;
