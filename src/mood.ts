import {
  cliExecute,
  Effect,
  getClanLounge,
  getWorkshed,
  haveEffect,
  itemAmount,
  mallPrice,
  myClass,
  myLevel,
  numericModifier,
  use,
  useSkill,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $item,
  $items,
  $skill,
  AsdonMartin,
  get,
  have,
  Mood,
  set,
  uneffect,
  Witchess,
} from "libram";
import { baseMeat, burnLibrams, questStep, safeRestoreMpTarget, setChoice } from "./lib";
import { withStash } from "./clan";
import { usingPurse } from "./outfit";

Mood.setDefaultOptions({
  songSlots: [
    $effects`Polka of Plenty`,
    $effects`Fat Leon's Phat Loot Lyric, Ur-Kel's Aria of Annoyance`,
    $effects`Chorale of Companionship`,
    $effects`The Ballad of Richie Thingfinder`,
  ],
  useNativeRestores: true,
});

export function meatMood(urKels = false, meat = baseMeat): Mood {
  // Reserve the amount of MP we try to restore before each fight.
  const mood = new Mood({ reserveMp: safeRestoreMpTarget() });

  mood.potion($item`How to Avoid Scams`, 3 * baseMeat);
  mood.potion($item`resolution: be wealthier`, 0.3 * baseMeat);
  mood.potion($item`resolution: be happier`, 0.15 * 0.45 * 0.8 * 200);

  const flaskValue = usingPurse() ? 0.3 * baseMeat : 5;
  mood.potion($item`Flaskfull of Hollow`, flaskValue);

  mood.skill($skill`Blood Bond`);
  mood.skill($skill`Leash of Linguini`);
  mood.skill($skill`Empathy of the Newt`);

  mood.skill($skill`The Polka of Plenty`);
  mood.skill($skill`Disco Leer`);
  mood.skill(urKels ? $skill`Ur-Kel's Aria of Annoyance` : $skill`Fat Leon's Phat Loot Lyric`);
  mood.skill($skill`Singer's Faithful Ocelot`);
  mood.skill($skill`The Spirit of Taking`);
  mood.skill($skill`Drescher's Annoying Noise`);
  mood.skill($skill`Pride of the Puffin`);
  mood.skill($skill`Walk: Leisurely Amble`);

  const mmjCost =
    (100 -
      (have($skill`Five Finger Discount`) ? 5 : 0) -
      (have($item`Travoltan trousers`) ? 5 : 0)) *
    (200 / (1.5 * myLevel() + 5));
  const genericManaPotionCost = mallPrice($item`generic mana potion`) * (200 / (2.5 * myLevel()));
  const mpRestorerCost = Math.min(mmjCost, genericManaPotionCost);

  if (myClass() !== $class`Pastamancer` && 0.1 * meat * 10 > mpRestorerCost) {
    mood.skill($skill`Bind Lasagmbie`);
  }

  if (getWorkshed() === $item`Asdon Martin keyfob`) mood.drive(AsdonMartin.Driving.Observantly);

  if (have($item`Kremlin's Greatest Briefcase`)) {
    mood.effect($effect`A View to Some Meat`, () => {
      if (get("_kgbClicksUsed") < 22) {
        const buffTries = Math.ceil((22 - get("_kgbClicksUsed")) / 3);
        cliExecute(`Briefcase buff ${new Array<string>(buffTries).fill("meat").join(" ")}`);
      }
    });
  }

  if (!get("concertVisited") && get("sidequestArenaCompleted") === "fratboy") {
    cliExecute("concert winklered");
  } else if (!get("concertVisited") && get("sidequestArenaCompleted") === "hippy") {
    cliExecute("concert optimist primal");
  }

  if (itemAmount($item`Bird-a-Day calendar`) > 0) {
    if (!have($skill`Seek out a Bird`) || !get("_canSeekBirds")) {
      use(1, $item`Bird-a-Day calendar`);
    }

    if (
      have($skill`Visit your Favorite Bird`) &&
      !get("_favoriteBirdVisited") &&
      (numericModifier($effect`Blessing of your favorite Bird`, "Meat Drop") > 0 ||
        numericModifier($effect`Blessing of your favorite Bird`, "Item Drop") > 0)
    ) {
      useSkill($skill`Visit your Favorite Bird`);
    }

    if (
      have($skill`Seek out a Bird`) &&
      get("_birdsSoughtToday") < 6 &&
      (numericModifier($effect`Blessing of the Bird`, "Meat Drop") > 0 ||
        numericModifier($effect`Blessing of the Bird`, "Item Drop") > 0)
    ) {
      // Ensure we don't get stuck in the choice if the count is wrong
      setChoice(1399, 2);
      useSkill($skill`Seek out a Bird`, 6 - get("_birdsSoughtToday"));
    }
  }

  if (
    have($skill`Incredible Self-Esteem`) &&
    $effects`Always be Collecting, Work For Hours a Week`.some((effect) => have(effect)) &&
    !get("_incredibleSelfEsteemCast")
  ) {
    useSkill($skill`Incredible Self-Esteem`);
  }

  const canRecord =
    getWorkshed() === $item`warbear LP-ROM burner` ||
    have($item`warbear LP-ROM burner` || get("questG04Nemesis") === "finished");

  if (myClass() === $class`Accordion Thief` && myLevel() >= 15 && !canRecord) {
    if (have($skill`The Ballad of Richie Thingfinder`)) {
      useSkill($skill`The Ballad of Richie Thingfinder`, 10 - get("_thingfinderCasts"));
    }
    if (have($skill`Chorale of Companionship`)) {
      useSkill($skill`Chorale of Companionship`, 10 - get("_companionshipCasts"));
    }
  }

  shrugBadEffects();

  return mood;
}

export function freeFightMood(...additionalEffects: Effect[]): Mood {
  const mood = new Mood();

  for (const effect of additionalEffects) {
    mood.effect(effect);
  }

  if (!get("_garbo_defectiveTokenAttempted", false)) {
    set("_garbo_defectiveTokenAttempted", true);
    withStash($items`defective Game Grid token`, () => {
      if (!get("_defectiveTokenUsed") && have($item`defective Game Grid token`)) {
        use($item`defective Game Grid token`);
      }
    });
  }

  if (!get("_glennGoldenDiceUsed")) {
    if (have($item`Glenn's golden dice`)) use($item`Glenn's golden dice`);
  }

  if (getClanLounge()["Clan pool table"] !== undefined) {
    while (get("_poolGames") < 3) cliExecute("pool aggressive");
  }

  if (haveEffect($effect`Blue Swayed`) < 50) {
    use(Math.ceil((50 - haveEffect($effect`Blue Swayed`)) / 10), $item`pulled blue taffy`);
  }
  mood.potion($item`white candy heart`, 30);

  mood.skill($skill`Curiosity of Br'er Tarrypin`);

  if ((get("daycareOpen") || get("_daycareToday")) && !get("_daycareSpa")) {
    cliExecute("daycare mysticality");
  }
  if (have($item`redwood rain stick`) && !get("_redwoodRainStickUsed")) {
    use($item`redwood rain stick`);
  }
  const beachHeadsUsed: number | string = get("_beachHeadsUsed");
  if (have($item`Beach Comb`) && !beachHeadsUsed.toString().split(",").includes("10")) {
    mood.effect($effect`Do I Know You From Somewhere?`);
  }
  if (Witchess.have() && !get("_witchessBuff")) {
    mood.effect($effect`Puzzle Champ`);
  }
  if (questStep("questL06Friar") === 999 && !get("friarsBlessingReceived")) {
    cliExecute("friars familiar");
  }
  if (have($item`The Legendary Beat`) && !get("_legendaryBeat")) {
    use($item`The Legendary Beat`);
  }
  if (have($item`portable steam unit`) && !get("_portableSteamUnitUsed", false)) {
    use($item`portable steam unit`);
  }
  shrugBadEffects(...additionalEffects);

  if (getWorkshed() === $item`Asdon Martin keyfob`) mood.drive(AsdonMartin.Driving.Observantly);

  return mood;
}

/**
 * Use buff extenders like PYEC and Bag o Tricks
 */
export function useBuffExtenders(): void {
  withStash($items`Platinum Yendorian Express Card, Bag o' Tricks`, () => {
    if (have($item`Platinum Yendorian Express Card`) && !get("expressCardUsed")) {
      burnLibrams();
      use($item`Platinum Yendorian Express Card`);
    }
    if (have($item`Bag o' Tricks`) && !get("_bagOTricksUsed")) {
      use($item`Bag o' Tricks`);
    }
  });
  if (have($item`License to Chill`) && !get("_licenseToChillUsed")) {
    burnLibrams();
    use($item`License to Chill`);
  }
}

const stings = [
  ...$effects`Apoplectic with Rage, Barfpits, Berry Thorny, Biologically Shocked, Bone Homie, Boner Battalion, Coal-Powered, Curse of the Black Pearl Onion, Dizzy with Rage, Drenched With Filth, EVISCERATE!, Fangs and Pangs, Frigidalmatian, Gummi Badass, Haiku State of Mind, It's Electric!, Jabañero Saucesphere, Jalapeño Saucesphere, Little Mouse Skull Buddy, Long Live GORF, Mayeaugh, Permanent Halloween, Psalm of Pointiness, Pygmy Drinking Buddy, Quivering with Rage, Scarysauce, Skeletal Cleric, Skeletal Rogue, Skeletal Warrior, Skeletal Wizard, Smokin', Soul Funk, Spiky Frozen Hair, Stinkybeard, Stuck-Up Hair, Can Has Cyborger, Feeling Nervous`,
  $effect`Burning, Man`,
  $effect`Yes, Can Haz`,
];
const textAlteringEffects = $effects`Can Has Cyborger, Dis Abled, Haiku State of Mind, Just the Best Anapests, O Hai!, Robocamo`;
export const teleportEffects = $effects`Teleportitis, Feeling Lost, Funday!`;
const otherwiseBadEffects = $effects`Temporary Blindness`;
export function shrugBadEffects(...exclude: Effect[]): void {
  [...stings, ...textAlteringEffects, ...teleportEffects, ...otherwiseBadEffects].forEach(
    (effect) => {
      if (have(effect) && !exclude.includes(effect)) {
        uneffect(effect);
      }
    }
  );
}
