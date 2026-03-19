import { Notice, Plugin, TAbstractFile, TFile } from "obsidian";
import {
  getDailyNoteSettings,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";
import TodoKeeperSettingTab from "./ui/TodoKeeperSettingTab";
import { getTodos } from "./get-todos";
import { DEFAULT_SETTINGS, PluginSettings } from "./types";
import {
  isEmptyTodo,
  insertTodosIntoNote,
  removeTodosFromNote,
  buildKeepNotice,
} from "./keep-utils";

const MAX_TIME_SINCE_CREATION = 5000; // 5 seconds

/** Strips leading/trailing slashes from a folder path. */
function cleanFolder(folder: string | undefined): string {
  if (!folder) return "";
  return folder.replace(/^\/|\/$/g, "");
}

/** Parses a daily note's date from its file path. */
function fileToMoment(file: TFile, folderPrefix: string, format: string) {
  let name = file.path;
  if (name.startsWith(folderPrefix)) name = name.slice(folderPrefix.length);
  if (name.endsWith(`.${file.extension}`))
    name = name.slice(0, -file.extension.length - 1);
  return window.moment(name, format, true);
}

/** Returns true if the file corresponds to today's daily note. */
function isTodaysDailyNote(file: TFile, folder: string, format: string): boolean {
  const folderPrefix = folder ? folder + "/" : "";
  const todayFormatted = window.moment().format(format);
  return file.path === `${folderPrefix}${todayFormatted}.${file.extension}`;
}

/** Returns the most recent daily note before today. */
function getPreviousDailyNote(folder: string, format: string): TFile | undefined {
  const allDailyNotes = getAllDailyNotes();
  const folderPrefix = folder ? folder + "/" : "";
  const todayMoment = window.moment();

  const sorted = Object.values(allDailyNotes)
    .map((file) => ({ file, moment: fileToMoment(file, folderPrefix, format) }))
    .filter(({ moment }) => moment.isValid() && moment.isBefore(todayMoment, "day"))
    .sort((a, b) => b.moment.valueOf() - a.moment.valueOf());

  return sorted[0]?.file;
}

export default class TodoKeeperPlugin extends Plugin {
  settings!: PluginSettings;

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  isDailyNotesEnabled(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const app = this.app as any;
    const dailyNotesEnabled = app.internalPlugins?.plugins["daily-notes"]?.enabled;
    const periodicNotesEnabled =
      app.plugins?.getPlugin("periodic-notes")?.settings?.daily?.enabled;
    return !!(dailyNotesEnabled || periodicNotesEnabled);
  }

  async getAllUnfinishedTodos(file: TFile): Promise<string[]> {
    const content = await this.app.vault.read(file);
    return getTodos({
      lines: content.split(/\r?\n|\r|\n/g),
      withChildren: this.settings.keepChildren,
      doneStatusMarkers: this.settings.doneStatusMarkers,
    });
  }

  async keepTodos(inputFile?: TFile): Promise<void> {
    // Resolve today's daily note (from argument or the daily notes index)
    const allDailyNotes = getAllDailyNotes();
    const file = inputFile ?? getDailyNote(window.moment(), allDailyNotes);
    if (!file) return;

    // Validate the file is actually today's daily note
    const { folder: rawFolder, format } = getDailyNoteSettings();
    const folder = cleanFolder(rawFolder);
    if (!isTodaysDailyNote(file, folder, format ?? "YYYY-MM-DD")) return;

    // When triggered by file creation, skip if the file is not brand new
    if (inputFile && Date.now() - file.stat.ctime > MAX_TIME_SINCE_CREATION) return;

    if (!this.isDailyNotesEnabled()) {
      new Notice(
        "Todo Keeper: unable to keep todos — please enable Daily Notes, or Periodic Notes (with daily notes enabled).",
        10000
      );
      return;
    }

    // Find the previous daily note and its unfinished todos
    const yesterday = getPreviousDailyNote(folder, format ?? "YYYY-MM-DD");
    if (!yesterday) return;

    const rawTodos = await this.getAllUnfinishedTodos(yesterday);
    if (rawTodos.length === 0) return;

    console.log(`todo-keeper: ${rawTodos.length} todos found in ${yesterday.basename}`);

    // Apply settings filters
    const { templateHeading, deleteOnComplete, removeEmptyTodos, leadingNewLine } =
      this.settings;
    const todos = removeEmptyTodos ? rawTodos.filter((t) => !isEmptyTodo(t)) : rawTodos;
    const emptiesSkipped = rawTodos.length - todos.length;

    // Insert todos into today's note
    let headingFound = true;
    if (todos.length > 0) {
      const todayContent = await this.app.vault.read(file);
      const { content, headingFound: found } = insertTodosIntoNote(
        todayContent,
        todos,
        templateHeading,
        leadingNewLine
      );
      headingFound = found;
      await this.app.vault.modify(file, content);
    }

    // Optionally delete matched todos from yesterday's note
    if (deleteOnComplete) {
      const yesterdayContent = await this.app.vault.read(yesterday);
      await this.app.vault.modify(
        yesterday,
        removeTodosFromNote(yesterdayContent, rawTodos)
      );
    }

    // Show a summary notice
    const headingNotFoundMessage = !headingFound
      ? `Todo Keeper: couldn't find '${templateHeading}' in today's daily note. Appending todos to end of file.`
      : null;
    const notice = buildKeepNotice(
      todos.length,
      deleteOnComplete ? emptiesSkipped : 0,
      headingNotFoundMessage
    );
    if (notice) new Notice(notice, 4000 + notice.length * 3);
  }

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new TodoKeeperSettingTab(this.app, this));

    this.registerEvent(
      this.app.vault.on("create", async (file: TAbstractFile) => {
        if (!this.settings.keepOnFileCreate) return;
        if (!(file instanceof TFile)) return;
        this.keepTodos(file);
      })
    );

    this.addCommand({
      id: "obsidian-todo-keeper-keep",
      name: "Keep Todos Now",
      callback: () => this.keepTodos(),
    });
  }
}

