import { Notice, Plugin, TAbstractFile, TFile } from "obsidian";
import {
  getDailyNoteSettings,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";
import RolloverSettingTab from "./ui/RolloverSettingTab";
import { getTodos } from "./get-todos";
import { DEFAULT_SETTINGS, PluginSettings } from "./types";

const MAX_TIME_SINCE_CREATION = 5000; // 5 seconds

export default class RolloverTodosPlugin extends Plugin {
  settings!: PluginSettings;

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  isDailyNotesEnabled() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const app = this.app as any;
    const dailyNotesPlugin = app.internalPlugins?.plugins["daily-notes"];
    const dailyNotesEnabled = dailyNotesPlugin && dailyNotesPlugin.enabled;

    const periodicNotesPlugin = app.plugins?.getPlugin("periodic-notes");
    const periodicNotesEnabled =
      periodicNotesPlugin && periodicNotesPlugin.settings?.daily?.enabled;

    return dailyNotesEnabled || periodicNotesEnabled;
  }

  getLastDailyNote(): TFile | undefined {
    const { folder: rawFolder, format } = getDailyNoteSettings();
    const folder = this.getCleanFolder(rawFolder);
    const folderPrefix = folder.length === 0 ? folder : folder + "/";

    const dailyNoteRegexMatch = new RegExp("^" + folderPrefix + "(.*).md$");
    const todayMoment = window.moment();

    const dailyNoteFiles = this.app.vault
      .getMarkdownFiles()
      .filter((file) => file.path.startsWith(folderPrefix))
      .filter((file) =>
        window
          .moment(file.path.replace(dailyNoteRegexMatch, "$1"), format, true)
          .isValid()
      )
      .filter((file) => file.basename)
      .filter((file) =>
        this.getFileMoment(file, folderPrefix, format ?? "YYYY-MM-DD").isSameOrBefore(
          todayMoment,
          "day"
        )
      );

    const sorted = dailyNoteFiles.sort(
      (a, b) =>
        this.getFileMoment(b, folderPrefix, format ?? "YYYY-MM-DD").valueOf() -
        this.getFileMoment(a, folderPrefix, format ?? "YYYY-MM-DD").valueOf()
    );
    return sorted[1];
  }

  getFileMoment(file: TFile, folder: string, format: string) {
    let path = file.path;

    if (path.startsWith(folder)) {
      path = path.substring(folder.length);
    }

    if (path.endsWith(`.${file.extension}`)) {
      path = path.substring(0, path.length - file.extension.length - 1);
    }

    return window.moment(path, format);
  }

  async getAllUnfinishedTodos(file: TFile): Promise<string[]> {
    const dn = await this.app.vault.read(file);
    const dnLines = dn.split(/\r?\n|\r|\n/g);

    return getTodos({
      lines: dnLines,
      withChildren: this.settings.rolloverChildren,
      doneStatusMarkers: this.settings.doneStatusMarkers,
    });
  }

  getCleanFolder(folder: string | undefined): string {
    if (!folder) return "";

    if (folder.startsWith("/")) {
      folder = folder.substring(1);
    }

    if (folder.endsWith("/")) {
      folder = folder.substring(0, folder.length - 1);
    }

    return folder;
  }

  async rollover(inputFile?: TFile) {
    const { folder: rawFolder, format } = getDailyNoteSettings();
    let ignoreCreationTime = false;

    let file: TFile | undefined = inputFile;
    if (file === undefined) {
      const allDailyNotes = getAllDailyNotes();
      file = getDailyNote(window.moment(), allDailyNotes);
      ignoreCreationTime = true;
    }
    if (!file) return;

    const folder = this.getCleanFolder(rawFolder);

    if (!file.path.startsWith(folder)) return;

    const today = new Date();
    const todayFormatted = window.moment(today).format(format);
    const filePathConstructed = `${folder}${folder == "" ? "" : "/"}${todayFormatted}.${file.extension}`;
    if (filePathConstructed !== file.path) return;

    if (today.getTime() - file.stat.ctime > MAX_TIME_SINCE_CREATION && !ignoreCreationTime)
      return;

    if (!this.isDailyNotesEnabled()) {
      new Notice(
        "RolloverTodosPlugin unable to rollover unfinished todos: Please enable Daily Notes, or Periodic Notes (with daily notes enabled).",
        10000
      );
    } else {
      const { templateHeading, deleteOnComplete, removeEmptyTodos, leadingNewLine } =
        this.settings;

      const lastDailyNote = this.getLastDailyNote();
      if (!lastDailyNote) return;

      const todos_yesterday = await this.getAllUnfinishedTodos(lastDailyNote);

      console.log(
        `rollover-daily-todos: ${todos_yesterday.length} todos found in ${lastDailyNote.basename}.md`
      );

      if (todos_yesterday.length == 0) return;

      let todosAdded = 0;
      let emptiesToNotAddToTomorrow = 0;
      const todos_today: string[] = removeEmptyTodos ? [] : [...todos_yesterday];
      if (removeEmptyTodos) {
        todos_yesterday.forEach((line) => {
          const trimmedLine = (line || "").trim();
          if (trimmedLine != "- [ ]" && trimmedLine != "- [  ]") {
            todos_today.push(line);
            todosAdded++;
          } else {
            emptiesToNotAddToTomorrow++;
          }
        });
      } else {
        todosAdded = todos_yesterday.length;
      }

      let templateHeadingNotFoundMessage = "";
      const templateHeadingSelected = templateHeading !== "none";

      if (todos_today.length > 0) {
        let dailyNoteContent = await this.app.vault.read(file);
        const todos_todayString = `\n${todos_today.join("\n")}`;

        if (templateHeadingSelected) {
          const contentAddedToHeading = dailyNoteContent.replace(
            templateHeading,
            `${templateHeading}${leadingNewLine ? "\n" : ""}${todos_todayString}`
          );
          if (contentAddedToHeading == dailyNoteContent) {
            templateHeadingNotFoundMessage = `Rollover couldn't find '${templateHeading}' in today's daily note. Rolling todos to end of file.`;
          } else {
            dailyNoteContent = contentAddedToHeading;
          }
        }

        if (!templateHeadingSelected || templateHeadingNotFoundMessage.length > 0) {
          dailyNoteContent += todos_todayString;
        }

        await this.app.vault.modify(file, dailyNoteContent);
      }

      if (deleteOnComplete) {
        const lastDailyNoteContent = await this.app.vault.read(lastDailyNote);
        const lines = lastDailyNoteContent.split("\n");

        for (let i = lines.length - 1; i >= 0; i--) {
          if (todos_yesterday.includes(lines[i])) {
            lines.splice(i, 1);
          }
        }

        await this.app.vault.modify(lastDailyNote, lines.join("\n"));
      }

      const todosAddedString =
        todosAdded == 0
          ? ""
          : `- ${todosAdded} todo${todosAdded > 1 ? "s" : ""} rolled over.`;
      const emptiesToNotAddToTomorrowString =
        emptiesToNotAddToTomorrow == 0
          ? ""
          : deleteOnComplete
          ? `- ${emptiesToNotAddToTomorrow} empty todo${
              emptiesToNotAddToTomorrow > 1 ? "s" : ""
            } removed.`
          : "";
      const part1 =
        templateHeadingNotFoundMessage.length > 0 ? templateHeadingNotFoundMessage : "";
      const part2 = `${todosAddedString}${todosAddedString.length > 0 ? " " : ""}`;
      const part3 = `${emptiesToNotAddToTomorrowString}${
        emptiesToNotAddToTomorrowString.length > 0 ? " " : ""
      }`;

      const nonBlankLines: string[] = [part1, part2, part3].filter((p) => p.length > 0);
      const message = nonBlankLines.join("\n");
      if (message.length > 0) {
        new Notice(message, 4000 + message.length * 3);
      }
    }
  }

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new RolloverSettingTab(this.app, this));

    this.registerEvent(
      this.app.vault.on("create", async (file: TAbstractFile) => {
        if (!this.settings.rolloverOnFileCreate) return;
        if (!(file instanceof TFile)) return;
        this.rollover(file);
      })
    );

    this.addCommand({
      id: "obsidian-rollover-daily-todos-rollover",
      name: "Rollover Todos Now",
      callback: () => {
        this.rollover();
      },
    });
  }
}

