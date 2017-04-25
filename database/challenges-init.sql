create table challenges (
  id serial primary key,
  title varchar(30) not null,
  description text not null,
  authorid integer not null,
  upvotes integer default 0 not null,
  downvotes integer default 0 not null,
  creation timestamp default current_timestamp not null
);
