import { SchemaOf, getModels } from './orm';

const connection = <const>{
  db: 'postgres',
  user: 'postgres',
  host: 'database',
  port: 5432
}

type MySchema = SchemaOf<typeof connection>;


async function go() {
  const models = await getModels(connection);
  const User = models.get('users');
  const Paper = models.get('papers');
  const Review = models.get('reviews');

  const papers = await Paper.findAll();

  for (let i = 0; i < papers.length; i++) {
    const paper = papers[i];
    const author = (await paper.author()).name;
    console.log(`paper id ${paper.id} title ${paper.title} author ${author}`);
  }

  const users = await User.findAll();
  users.forEach(user => {
    const id = user.id;
    const name = user.name;
    console.log(`their name is ${name} and id is ${id}`);
  });

  // This exercises transitive foreign key traversals
  const review = (await Review.findAll())[0];
  const { author, id, paper, score } = review;
  const opaper = await paper();
  const oauthor = await author();
  console.log(`the review had score ${score} and was written by ${oauthor.name}`);
  console.log(`the paper it was about was by ${(await opaper.author()).name}`);

  process.exit(0);
}

go();
