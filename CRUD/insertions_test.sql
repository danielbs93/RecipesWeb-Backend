DECLARE @UNIQUEX UNIQUEIDENTIFIER
SET @UNIQUEX = NEWID();
INSERT INTO users VALUES ( @UNIQUEX , 'dbs' , '1234' , 'daniel' , 'ben simon' ,'ben@gmail.com','//http:blabla')