create table videos (
  title varchar(15) not null,
  authorid integer not null,
  upvotes integer default 0 not null,
  downvotes integer default 0 not null,
  creation timestamp default current_timestamp not null,
  id integer primary key not null
);
