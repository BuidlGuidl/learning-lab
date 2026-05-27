import type { NextPage } from "next";
import { Deck } from "~~/components/deck/Deck";
import { deck } from "~~/decks/example/deck";

const Home: NextPage = () => {
  return <Deck deck={deck} />;
};

export default Home;
