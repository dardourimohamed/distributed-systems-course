#!/usr/bin/env python3
"""
mdbook-quiz compatible preprocessor for mdbook 0.5.x.
Replaces {{#quiz path}} with the quiz HTML that quiz-embed.iife.js expects.
"""

import html
import json
import os
import re
import sys

try:
    import tomllib
except ImportError:
    import tomli as tomllib

QUIZ_RE = re.compile(r'\{\{#quiz\s+([^}]+)\}\}')


def escape_attr(value):
    """Escape a value for use inside a double-quoted HTML attribute."""
    return html.escape(value, quote=True)


def replace_quizzes(content, chapter_dir, config):
    """Replace all {{#quiz path}} references with quiz HTML."""
    fullscreen = config.get("fullscreen", True)
    cache_answers = config.get("cache-answers", True)

    def replacer(match):
        quiz_path = match.group(1).strip()
        quiz_file = os.path.join(chapter_dir, quiz_path)

        try:
            with open(quiz_file, "rb") as f:
                quiz_data = tomllib.load(f)
        except FileNotFoundError:
            print(f"WARNING: Quiz file not found: {quiz_file}", file=sys.stderr)
            return f"<p><em>Quiz not found: {quiz_path}</em></p>"
        except Exception as e:
            print(f"WARNING: Error reading quiz file {quiz_file}: {e}", file=sys.stderr)
            return f"<p><em>Error loading quiz: {quiz_path}</em></p>"

        quiz_name = os.path.splitext(os.path.basename(quiz_path))[0]

        # All data values must be JSON-encoded then HTML-escaped,
        # because quiz-embed.iife.js calls JSON.parse() on every dataset attribute.
        def data_attr(key, value):
            json_val = json.dumps(value, ensure_ascii=False)
            return f'data-{key}="{escape_attr(json_val)}"'

        attrs = 'class="quiz-placeholder"'
        attrs += f' {data_attr("quiz-name", quiz_name)}'
        attrs += f' {data_attr("quiz-questions", quiz_data)}'
        if fullscreen:
            attrs += f' {data_attr("quiz-fullscreen", True)}'
        if cache_answers:
            attrs += f' {data_attr("quiz-cache-answers", True)}'

        return f'<div {attrs}></div>'

    return QUIZ_RE.sub(replacer, content)


def process_items(items, src_dir, config):
    """Process book items, replacing quiz references in chapters."""
    for item in items:
        if "Chapter" in item:
            chapter = item["Chapter"]
            source_path = chapter.get("source_path", "")
            chapter_dir = os.path.dirname(os.path.join(src_dir, source_path)) if source_path else src_dir

            if "content" in chapter:
                chapter["content"] = replace_quizzes(chapter["content"], chapter_dir, config)

            if "sub_items" in chapter:
                process_items(chapter["sub_items"], src_dir, config)


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "supports":
        sys.exit(0)

    raw = sys.stdin.buffer.read()
    data = json.loads(raw)
    context, book = data[0], data[1]

    root = context.get("root", ".")
    src_dir = os.path.join(root, context.get("config", {}).get("book", {}).get("src", "src"))
    preprocessor_config = context.get("config", {}).get("preprocessor", {}).get("quiz", {})

    if "items" in book:
        process_items(book["items"], src_dir, preprocessor_config)

    sys.stdout.buffer.write(json.dumps(book, ensure_ascii=False).encode("utf-8"))


if __name__ == "__main__":
    main()
