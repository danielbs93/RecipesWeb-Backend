DECLARE @UNIQUEX UNIQUEIDENTIFIER
SET @UNIQUEX = NEWID();
INSERT INTO family_recipes VALUES ( @UNIQUEX , '6099fd61-8841-48db-826a-6cfcabf16063' , 'cake' , 'Mom' , '40 min' ,'//http:blabla')

INSERT INTO recipes VALUES ( NEWID(), '6099fd61-8841-48db-826a-6cfcabf16063', 'shnitzel' , '30', '0','0','7','123','123')
INSERT INTO recipes VALUES ( NEWID(), '6099fd61-8841-48db-826a-6cfcabf16063', 'rice' , '20', '1','1','7','123','123')
INSERT INTO recipes VALUES ( NEWID(), '6099fd61-8841-48db-826a-6cfcabf16063', 'pasta' , '20', '1','0','7','123','123')
INSERT INTO recipes VALUES ( NEWID(), '6099fd61-8841-48db-826a-6cfcabf16063', 'chiken' , '30', '0','0','7','123','123')