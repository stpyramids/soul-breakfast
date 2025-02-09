import {
  Component,
  ComponentType,
  createElement,
  Fragment,
  render,
} from "preact";
import { MonsterArchetypes } from "../data/monsters";
import type { GameState } from "../game";
import type { XYContents } from "../map";
import { getSoul, monsterHasStatus } from "../monster";
import {
  describeSoulEffect,
  describeSoulEffects,
  Soul,
  StatBonusEffect,
} from "../souls";
import { glyphChar, rgb, tokenChar, tokenRGB } from "../token";
import { handleKey, UIState } from "../ui";

declare var APP_VERSION: string;

export function renderControls(
  game: GameState,
  ui: UIState,
  messages: [string, string][][]
) {
  render(<Interface {...{ game, ui, messages }} />, document.body);
}

function Interface(props: {
  game: GameState;
  ui: UIState;
  messages: [string, string][][];
}) {
  return (
    <div class="wrapper">
      <Playarea ui={props.ui} />
      <Sidebar ui={props.ui} game={props.game} />
      <div id="mapDanger">
        {props.ui.state.mapDescription +
          " [Danger: " +
          props.game.map.danger +
          "]"}
      </div>
      <MessageLog messages={props.messages} />
    </div>
  );
}

function Playarea(props: { ui: UIState }) {
  let el: createElement.JSX.Element | null = null;
  if (props.ui.activeChoice) {
    el = <ChoiceBox ui={props.ui} />;
  }
  if (props.ui.specialMode === "help-about") {
    el = (
      <div class="info">
        <h3>About This Game</h3>
        <p>
          In <i>Soul Breakfast</i>, you play as the undead remnant of a great
          wizard-king. In ages past, you were overthrown and killed by a gang of
          mercenaries paid and armed by your rivals. But your ambitions are too
          superb to be overcome by death. Many times before have you used your
          mastery of soul essence to reclaim what remains of your physical form
          and fight your way back to power, only to be struck down again by
          do-gooder sellswords.
        </p>
        <p>
          This time will be different, however. Over many years you have
          unraveled the rituals of abjuration and binding woven into your
          resting ground and twisted them to your purpose. Your soul is bound to
          this place, true, but so too are the souls of all within it. You have
          learned to use your sovereign power over this place to trap and devour
          the souls of all who stand against you, or even turn their power to
          your own ends. With this power, you shall reclaim what is yours, and
          your vengeance will never end.
        </p>
        <p>
          But first, you find yourself drained after the exertions necessary to
          return yourself to the mortal realm. You must replenish your essence
          by draining the weaklings and vermin. It is time to break the fast.
        </p>
      </div>
    );
  } else if (props.ui.specialMode === "help-commands") {
    el = (
      <div class="info">
        <h3>Help: Controls</h3>
        <p>
          <strong>h/j/k/l:</strong> Move west/south/north/east
        </p>
        <p>
          <strong>H/J/K/L</strong>: Move west/south/north/east until threat is
          seen
        </p>
        <p>
          <strong>.</strong>: Wait a turn
        </p>
        <p>
          <strong>d</strong>: Devour soul of dying opponent, refilling your
          essence
        </p>
        <p>
          <strong>c</strong>: Claim soul of dying opponent, increasing your
          abilities
        </p>
        <p>
          <strong>r</strong>: Release a claimed soul to refill your essence
        </p>
        <p>
          <strong>Space</strong>: Attack targeted opponent
        </p>
        <p>
          <strong>&gt;</strong>: Pass through exit to a different area (requires
          sufficient essence)
        </p>
        <p>
          <strong>a</strong>: Activate ability, if you have any (gained from
          claiming souls)
        </p>
        <p>
          <strong>Q</strong>: Forfeit and restart the game
        </p>
        <p>
          <strong>Z</strong>: Toggle 2x/1x zoom mode (2x/1x)
        </p>
        <p>
          <strong>T</strong>: Toggle graphical/ASCII tiles mode
        </p>
        <p>
          <strong>?</strong>: This help
        </p>
        <p>
          <strong>W</strong>: Debug commands (if wizard mode is enabled)
        </p>
      </div>
    );
  } else if (props.ui.specialMode === "help-tips") {
    el = (
      <div class="info">
        <h3>Help: Tips</h3>
        <p>
          <strong>Be cowardly.</strong> You are physically weak but faster and
          smarter than your opponents. You do not need to kill everything you
          see. A strategic retreat always beats a glorious death.
        </p>
        <p>
          <strong>Conserve resources.</strong> Dying enemies will eventually
          die, wasting all of their essence. If you're full up on essence, it
          might be better to ignore weaker enemies, leaving them to prey on
          later.
        </p>
      </div>
    );
  } else if (props.ui.specialMode === "help-credits") {
    el = (
      <div class="info credits">
        <h3>
          <em>Soul Breakfast version {APP_VERSION}</em>
        </h3>
        <p>Original version created for the 2022 7 Day Roguelike challenge</p>
        <p>
          <strong>Design, Code, &amp; "Art"</strong>: stepped pyramids (Matt
          Boeh)
        </p>
        <p>
          <strong>Playtesting &amp; Feedback:</strong> Drew, Garren, Jesse,
          Robert, Sean
        </p>
        <p>
          <strong>Thanks:</strong> The 'cob, 7DRL community
        </p>
        <p>
          <strong>Built With:</strong> TypeScript, esbuild, rot.js, pixi.js,
          Preact
        </p>
        <p>
          <a
            href="https://github.com/stpyramids/soul-breakfast"
            target="_blank"
          >
            Project Page
          </a>
        </p>
      </div>
    );
  }
  return (
    <div id="playarea">
      <Canvas />
      <div id="dialog" style={el ? "" : "display:none"}>
        {el}
      </div>
    </div>
  );
}

class Canvas extends Component {
  shouldComponentUpdate = () => false;
  render(props: {}) {
    return <div id="canvasContainer"></div>;
  }
}

function ChoiceBox(props: { ui: UIState }) {
  let choice = props.ui.activeChoice;
  if (!choice) {
    return null;
  }
  let doClick = (key: string) => (e: MouseEvent) => {
    handleKey(key);
  };
  return (
    <div id="choiceBox">
      <div class="prompt">{choice.prompt}</div>
      <div class="opts">
        {Array.from(choice.opts, ([key, item]) => (
          <div class="opt-choice" key={key} onClick={doClick(key)}>
            <div class="choice-key">{key}</div>
            <div class="choice-item">{item}</div>
          </div>
        ))}
        <div class="opt-choice" key="ESC" onClick={doClick("Esc")}>
          <div class="choice-key">ESC</div>
          <div class="choice-item">Cancel</div>
        </div>
      </div>
    </div>
  );
}

function Sidebar(props: { ui: UIState; game: GameState }) {
  const game = props.game;
  return (
    <div id="sidebar">
      <h1>SOUL 👻 BREAK 💀 FAST</h1>
      <StatusView game={game} ui={props.ui} />
      {props.ui.state.onGround ? (
        <SidebarSection
          label="On Ground"
          element={WhatsHereView}
          here={props.ui.state.onGround}
        />
      ) : null}
      <SidebarSection
        label="Souls"
        element={SoulListView}
        souls={game.player.soulSlots.generic}
      />
      {props.ui.state.targets.length > 0 ? (
        <SidebarSection
          label="Targets"
          element={TargetsView}
          targets={props.ui.state.targets}
          brief={false}
        />
      ) : null}
      {props.ui.state.visible.length > 0 ? (
        <SidebarSection
          label="In View"
          element={TargetsView}
          targets={props.ui.state.visible}
          brief={true}
        />
      ) : null}
    </div>
  );
}

function SidebarSection<P>(
  props: {
    label: string;
    element: ComponentType<P>;
  } & P
) {
  return (
    <div class="sidebar-section">
      <h2>{props.label}</h2>
      {createElement(props.element, props)}
    </div>
  );
}

function StatusView(props: { ui: UIState; game: GameState }) {
  let full = "rgba(0, 108, 139, 1)";
  let empty = "rgba(94, 94, 94, 1)";
  let essencePct = Math.floor(
    (props.ui.state.playerEssence / props.ui.state.playerMaxEssence) * 100
  );
  let gradient = `background: linear-gradient(90deg, ${full} 0%, ${full} ${essencePct}%, ${empty} ${essencePct}%, ${empty} ${essencePct}%);`;
  return (
    <div id="status">
      <div class="stat">
        <div class="stat-label">Essence</div>
        <div class="stat-value" id="essence" style={gradient}>
          {props.ui.state.playerEssence} / {props.ui.state.playerMaxEssence}
        </div>
      </div>
      <div class="stat">
        <div class="stat-label">Turns</div>
        <div class="stat-value" id="turns">
          {props.game.turns}
        </div>
      </div>
    </div>
  );
}

export function WhatsHereView(props: { here: XYContents }) {
  const here = props.here;
  let glyph = "";
  let what = "";
  let desc = "";
  if (here.monster) {
    let soul = getSoul(here.monster);
    glyph = tokenChar(soul.token);
    what = soul.name;
    desc = describeSoulEffects(soul);
  } else if (here.tile) {
    glyph = glyphChar(here.tile.glyph);
    what = here.tile.glyph;
    if (here.exitDanger) {
      desc = "Danger: " + here.exitDanger;
    }
  }
  return (
    <div id="whatsHere">
      <div class="soul-glyph" id="hereGlyph">
        {glyph}
      </div>
      <div class="soul-name" id="hereWhat">
        {what}
      </div>
      <div class="soul-effect" id="hereDescription">
        {desc}
      </div>
    </div>
  );
}

function SoulListView(props: { souls: Array<Soul> }) {
  return (
    <div id="souls">
      {...props.souls.map((soul) => <SoulView soul={soul} />)}
    </div>
  );
}

function SoulView(props: { soul: Soul }) {
  let meE = props.soul.effects.find(
    (e) => e.type == "stat bonus" && e.stat == "max essence"
  );
  let nonME = props.soul.effects.filter(
    (e) => !(e.type == "stat bonus" && e.stat == "max essence")
  );
  let meV = meE ? "+" + (meE as StatBonusEffect).power + " ME" : "";
  return (
    <Fragment key={props.soul.name}>
      <div class="soul-glyph" style={"color: " + tokenRGB(props.soul.token)}>
        {tokenChar(props.soul.token)}
      </div>
      <div class="soul-name">{props.soul.name}</div>
      <div class="soul-maxessence">{meV}</div>
      <div class="soul-effect">
        {nonME.map((e) => describeSoulEffect(e)).join(", ")}
      </div>
    </Fragment>
  );
}

function TargetsView(props: { targets: XYContents[]; brief: boolean }) {
  let items = props.targets.map(targetToItem);
  let groups: { [k: string]: TargetItem[] } = {};
  for (let i of items) {
    if (i) {
      if (!groups[i.name]) {
        groups[i.name] = [i];
      } else {
        groups[i.name].push(i);
      }
    }
  }
  let grouped = Object.values(groups).map((is) => ({
    ...is[0],
    name: is[0].name + (is.length > 1 ? " x" + is.length : ""),
  }));
  return (
    <div id="targets">
      {grouped.map((i) => (
        <TargetItem item={i} brief={props.brief} />
      ))}
    </div>
  );
}

type TargetItem = {
  name: string;
  glyph: string;
  color: string;
  thoughts: string;
};

function targetToItem(c: XYContents): TargetItem | null {
  if (c.monster) {
    let arch = MonsterArchetypes[c.monster.archetype];
    let glyph = glyphChar(arch.glyph);
    let color = rgb(arch.color);
    let name = arch.name;
    let statuses = [];
    if (monsterHasStatus(c.monster, "dying")) {
      statuses.push("dying");
    } else {
      if (arch.soul == "vermin") {
        statuses.push("vermin");
      } else if (c.monster.hp === c.monster.maxHP) {
        statuses.push("unharmed");
      } else if (c.monster.hp < c.monster.maxHP / 2) {
        statuses.push("heavily wounded");
      } else {
        statuses.push("slightly wounded");
      }
      c.monster.statuses.forEach((s) => {
        statuses.push(s.type);
      });
    }
    name += " (" + statuses.join(", ") + ")";
    let thoughts = arch.description;
    return {
      name,
      glyph,
      color,
      thoughts,
    };
  } else {
    return null;
  }
}

function TargetItem(props: { item: TargetItem; brief: boolean }) {
  let t = props.item;
  return t ? (
    <div class="target-entry">
      <div class="target-glyph soul-glyph" style={"color: " + t.color}>
        {t.glyph}
      </div>
      <div class="target-name soul-name">{t.name}</div>
      {props.brief ? null : <div class="target-thoughts">{t.thoughts}</div>}
    </div>
  ) : null;
}

function MessageLog(props: { messages: [string, string][][] }) {
  let entries = props.messages
    .map((msgs, i) => {
      let log = msgs.map(([msg, msgType], i) => (
        <span class={"msg-" + msgType}>{msg + " "}</span>
      ));
      return <li key={"mgs-turn-" + i}>{...log}</li>;
    })
    .reverse();
  return (
    <div id="messages">
      <ul class="messageLog">{...entries}</ul>
    </div>
  );
}
