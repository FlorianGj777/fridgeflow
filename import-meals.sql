-- Import des 24 repas depuis Notion
-- 24 requêtes indépendantes, chacune insère 1 repas + ses ingrédients

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Orzo tomate','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Tomates cerises'),('Echalotte'),('Vin'),('Concentre de tomate'),('Poulet'),('Orzo'),('Creme'),('Ail')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Ravioli','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Ravioli'),('Creme'),('Muscade'),('Parmesan'),('Fromage rappe'),('Huile d''olive')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Nouille','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Nouilles udon'),('Boeuf poulet'),('Carotte'),('Oignon'),('Poivron'),('Chou blanc'),('Ail'),('Sauce soja')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Lasagne','',4 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Tomates concassees'),('Oignon'),('Courgette'),('Poivron'),('Carotte'),('Lasagnes'),('Mozzarella'),('Parmesan'),('Basilic')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Legumes four sauce feta','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Feta'),('Yaourt grec'),('Patate douce'),('Brocoli'),('Pomme de terre')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Salade Epinards','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Radis'),('Concombre'),('Mais'),('Tomate cerise'),('Feta'),('Avocat'),('Epinard')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Quesadilla','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Tortillas'),('Cheddar'),('Haricots rouges'),('Poivron'),('Oignon'),('Ail'),('Cumin'),('Paprika'),('Citron')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Soupe champignon','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Oignon'),('Champignons'),('Pommes de terre'),('Ail'),('Creme liquide')) t(n);

INSERT INTO meals (user_id, name, description, servings) SELECT id,'Croque Monsieur','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com';

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Salade Houmous','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Houmous'),('Pois chiche'),('Tomates cerises'),('Avocat'),('Riz'),('Citron')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Soupe au potiron','',4 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Pommes de terre'),('Potiron'),('Oignon'),('Poivrons'),('Beurre')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Wraps','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Wraps'),('Salade'),('Tomates cerises'),('Sauce'),('Oignons frits'),('Fromage wraps'),('Crousty chevre')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Bagel maison','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Farine'),('Fromage blanc'),('Levure'),('Saumon'),('Concombre'),('Avocat'),('Epinard')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Tarte courgette','',4 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Pate a tarte'),('Courgette'),('Fromage herbes')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Salade de pates','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Pates'),('Mais'),('Tomate cerise'),('Feta'),('Thon'),('Avocat'),('Citron')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Pates brocoli','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Pates penne'),('Brocoli'),('Creme culinaire'),('Parmesan'),('Pignons de pin'),('Ail'),('Citron')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Pates sauce rouge','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Sauce rouge'),('Pates'),('Parmesan'),('Fromage rappe')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Falafel','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Pain Falafel'),('Falafel'),('Houmous'),('Salade'),('Tomate cerise'),('Avocat')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Tacos','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Mini wraps'),('Mais'),('Tomates sechees'),('Haricots'),('Poivron rouge'),('Avocat'),('Oignon'),('Cheddar'),('Creme')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Bagel','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Fromage a tartiner'),('Bagel'),('Citron'),('Avocat'),('Saumon')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Crepes salees','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Crepes'),('Fromage rappe'),('Fromage pizza'),('Jambon'),('Fromage herbes')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Sandwich tomate mozza','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Baguette'),('Mozzarella'),('Grande tomate'),('Pesto'),('Mortadelle')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Mozza tomate et guacamole','',2 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,1,'unit' FROM m,(VALUES ('Mozzarella'),('Grandes tomates'),('Avocat'),('Pain pour toastes'),('Citron')) t(n);

WITH m AS (INSERT INTO meals (user_id, name, description, servings) SELECT id,'Menu Disney Toys Story','',4 FROM auth.users WHERE email='florian.grosjean.pro@gmail.com' RETURNING id)
INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity, unit) SELECT m.id,t.n,t.q::numeric,t.u FROM m,(VALUES ('Mini pizza',1,'unit'),('Patate au four',1,'unit'),('Nuggets',1,'unit'),('Beurre',180,'g'),('Sucre en poudre',180,'g'),('Vanille',1,'unit'),('Vanille liquide',1,'unit'),('Oeufs',2,'unit'),('Farine',260,'g'),('Lait',180,'ml'),('Levure',1,'unit'),('Poudre amande',20,'g'),('Mascarpone',1,'unit'),('Sucre glace',1,'unit')) t(n,q,u);
