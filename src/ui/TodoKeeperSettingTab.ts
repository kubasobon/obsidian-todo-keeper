import { App, PluginSettingTab, Setting, TFile } from "obsidian";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";
import type TodoKeeperPlugin from "../index";

export default class TodoKeeperSettingTab extends PluginSettingTab {
  plugin: TodoKeeperPlugin;

  constructor(app: App, plugin: TodoKeeperPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async getTemplateHeadings(): Promise<string[]> {
    const { template } = getDailyNoteSettings();
    if (!template) return [];

    let file = this.app.vault.getAbstractFileByPath(template);

    if (file === null) {
      file = this.app.vault.getAbstractFileByPath(template + ".md");
    }

    if (!(file instanceof TFile)) {
      return [];
    }

    const templateContents = await this.app.vault.read(file);
    const allHeadings = Array.from(templateContents.matchAll(/#{1,} .*/g)).map(
      ([heading]) => heading
    );
    return allHeadings;
  }

  async display() {
    const templateHeadings = await this.getTemplateHeadings();

    this.containerEl.empty();
    new Setting(this.containerEl)
      .setName("Template heading")
      .setDesc("Which heading from your template should the todos go under")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            ...templateHeadings.reduce<Record<string, string>>((acc, heading) => {
              acc[heading] = heading;
              return acc;
            }, {}),
            none: "None",
          })
          .setValue(this.plugin?.settings.templateHeading)
          .onChange((value) => {
            this.plugin.settings.templateHeading = value;
            this.plugin.saveSettings();
          })
      );

    new Setting(this.containerEl)
      .setName("Delete todos from previous day")
      .setDesc(
        `Once todos are found, they are added to Today's Daily Note. If successful, they are deleted from Yesterday's Daily note. Enabling this is destructive and may result in lost data. Keeping this disabled will simply duplicate them from yesterday's note and place them in the appropriate section. Note that currently, duplicate todos will be deleted regardless of what heading they are in, and which heading you choose from above.`
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.deleteOnComplete || false)
          .onChange((value) => {
            this.plugin.settings.deleteOnComplete = value;
            this.plugin.saveSettings();
          })
      );

    new Setting(this.containerEl)
      .setName("Remove empty todos when keeping")
      .setDesc(`If you have empty todos, they will not be kept in the next day's note.`)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.removeEmptyTodos || false)
          .onChange((value) => {
            this.plugin.settings.removeEmptyTodos = value;
            this.plugin.saveSettings();
          })
      );

    new Setting(this.containerEl)
      .setName("Keep children of todos")
      .setDesc(
        `By default, only the actual todos are kept. If you add nested Markdown-elements beneath your todos, these are not kept but stay in place, possibly altering the logic of your previous note. This setting allows for also migrating the nested elements.`
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.keepChildren || false)
          .onChange((value) => {
            this.plugin.settings.keepChildren = value;
            this.plugin.saveSettings();
          })
      );

    new Setting(this.containerEl)
      .setName("Automatically keep todos on daily note open")
      .setDesc(`If enabled, the plugin will automatically keep todos when you open a daily note.`)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.keepOnFileCreate ?? true)
          .onChange((value) => {
            this.plugin.settings.keepOnFileCreate = value;
            this.plugin.saveSettings();
          })
      );

    new Setting(this.containerEl)
      .setName("Done status markers")
      .setDesc(
        `Characters that represent done status in checkboxes. Default is "xX-". Add any characters that should be considered as marking a task complete.`
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings.doneStatusMarkers || "xX-")
          .onChange((value) => {
            this.plugin.settings.doneStatusMarkers = value;
            this.plugin.saveSettings();
          })
      );

    new Setting(this.containerEl)
      .setName("Add extra blank line between Heading and Todos")
      .setDesc(
        `Whether to add an extra blank line between the selected Heading and the kept todos. This will only work in combination with a configured Template Heading.`
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.leadingNewLine ?? true)
          .onChange((value) => {
            this.plugin.settings.leadingNewLine = value;
            this.plugin.saveSettings();
          })
      );
  }
}

