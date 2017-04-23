create user hmbserver with encrypted password 'dummypassword';
grant all privileges on table users to hmbserver;
grant all privileges on sequence users_id_seq to hmbserver;
grant all privileges on table user_sessions to hmbserver;
