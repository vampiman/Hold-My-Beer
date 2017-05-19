create table videos (
  id uuid primary key not null,
  title varchar(15) not null,
  challengeid integer not null,
  authorid integer not null,
  upvotes integer default 0 not null,
  downvotes integer default 0 not null,
  creation timestamp default (now() at time zone 'utc') not null
);
