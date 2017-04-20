create extension citext;
create table users (
  name varchar(15) not null,
  email citext unique not null,
  avatar varchar(32), -- MD5 hash of the image for deduping and storage on filesystem
  hash varchar(60), -- bcrypt hash
  id serial primary key
);
