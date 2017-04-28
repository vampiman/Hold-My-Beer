create table challenges (
  title varchar(30) not null,
  description text not null,
  authorid integer not null,
  upvotes integer default 0 not null,
  downvotes integer default 0 not null,
  creation timestamp default (now() at time zone 'utc') not null,
  id serial primary key
);
