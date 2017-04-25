create table videos (
  id integer primary key not null,
  title varchar(15) not null,
  authorid integer not null,
  upvotes integer default 0 not null,
  downvotes integer default 0 not null,
  creation timestamp default current_timestamp not null
);
