# Todo Keeper

[![Build](https://github.com/kubasobon/obsidian-todo-keeper/actions/workflows/ci.yml/badge.svg)](https://github.com/kubasobon/obsidian-todo-keeper/actions/workflows/ci.yml)

This Obsidian plugin carries over any incomplete todo items from the previous daily note (could be yesterday, or a week ago) to today. This is triggered automatically when a new daily note is created via the internal `Daily notes` plugin, or the `Periodic Notes` plugin. It can also be run as a command from the Command Palette.

![A demo of the plugin working](./demo.gif)

## Usage

### 1. New Daily Note

Just create a new daily note using the `Daily notes` or `Periodic Notes` plugin. The previous day's incomplete todos will be kept in today's daily note.

**Note:** Automatic keep can cause conflicts with other plugins, particularly the Templater plugin. If you're using Templater for your daily notes, it's recommended that you disable automatic keep in the plugin's settings and instead trigger it manually after creation.

### 2. Command: Keep Todos Now

You can also open your command palette (CMD+P on macOS) and start typing `keep` to find this command. No matter where you are in Obsidian, the previous day's todos will be moved forward to today's note (if it doesn't exist, nothing will happen), from the chronologically closest (in the past) daily note.

## Requirements

- [ ] You must have either:
  1. `Daily notes` plugin installed _or_
  2. `Periodic Notes` plugin installed AND the **Daily Notes** setting toggled on
- [ ] A Note folder set in one of these plugins. Inside it you must have:
  1. 2 or more notes
  2. All notes must be named in the format you use for daily notes (for example `2021-08-29` for `YYYY-MM-DD` )

## Settings

### 1. Disable automatic keep

If you prefer to trigger keeping todos manually, you can use this setting to prevent the plugin from doing it automatically when a new note is created.

### 2. Template Heading

If you chose a template file to use for new daily notes in `Daily notes > Settings` or `Periodic Notes > Settings`, you will be able to choose a heading for incomplete todos to go under. Note that incomplete todos are taken from the entire file, regardless of what heading they are under. And they are all kept in today's daily note, right under the heading of choice.

If you leave this field as blank, or select `None`, then incomplete todos will be appended to the end of today's note (for new notes with no template, the end is the beginning of the note).

### 3. Delete todos from previous day

By default, this plugin copies incomplete todos. So if you forgot to wash your dog yesterday and didn't check it off, you will have an incomplete checkmark on yesterday's daily note, and a new incomplete checkmark in today's daily note.

Toggling this setting on will remove incomplete todos from the previous daily note once today's daily note has a copy of them.

### 4. Remove empty todos when keeping

By default, this plugin will keep anything that has a checkbox, whether it has content or not. Toggling this setting on will ignore empty todos. If you have **#3** from above toggled on, it will also delete empty todos.

### 5. Keep children of todos

By default, only the actual todos are kept. If you add nested Markdown elements beneath your todos, these are not kept but stay in place. Toggling this setting on allows for also migrating the nested elements, including ones that are completed.

### 6. Done status markers

By default, the plugin considers checkboxes containing 'x', 'X', or '-' as completed tasks that won't be kept. You can customize this by adding any characters that should be considered "done" markers. For example, adding '?+>' would also treat checkboxes like '[?]', '[+]', and '[>]' as completed tasks. This is useful for users of custom status markers like the [Obsidian Tasks](https://publish.obsidian.md/tasks/Introduction) plugin.

The plugin supports Unicode characters, including complex emoji and grapheme clusters, in checkbox content. This means you can use emojis or special Unicode characters as status markers and they will be handled correctly.

## Bugs/Issues

1. Sometimes you will use this plugin, and your unfinished todos will stay in the same spot. These could be formatting issues.

- Regex is used to search for unfinished todos: `/\s*[-*+] \[[^xX-]\].*/g` (or with your custom done markers)
- At a minimum, they need to look like: `start of line | tabs`-` `[` `]`Your text goes here`
- If you use spaces instead of tabs at the start of the line, the behavior of the plugin can be inconsistent. Sometimes it'll keep items but not delete them from the previous day when you have that option toggled on.

2. Sometimes, if you trigger the `keepTodos` function too quickly, it will read the state of a file before the new data was saved to disk. For example, if you add a new incomplete todo to yesterday's daily note, and then quickly run the `Keep Todos Now` command, it may grab the state of the file a second or two before you ran the command. Wait a second or two, then try again.

For example (no template heading, empty todos toggled on):

```markdown
You type in:

- [x] Do the dishes
- [ ] Take out the trash

And then you run the Keep Todos Now command. Today's daily note might look like:

- [ ] Take out the trash

And the previous day might look like

- [x] Do the dishes
```

3. There are sometimes conflicts with other plugins that deal with new notes -- particularly the Templater plugin. In these situations, your todos may be removed from your previous note, and then not be saved into your new daily note. The simplest remedy is to disable the automatic keep, and instead trigger it manually.

## Installation

This plugin can be installed within the `Third-party Plugins` tab within Obsidian

## Attribution

Forked from [obsidian-rollover-daily-todos](https://github.com/lumoe/obsidian-rollover-daily-todos) by [lumoe](https://github.com/lumoe), licensed under MIT.
