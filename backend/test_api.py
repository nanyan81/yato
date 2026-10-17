"""使用临时文件测试，不碰真实任务存档。"""
import json
import tempfile
import unittest
from pathlib import Path
from fastapi import HTTPException
from pydantic import ValidationError
from backend import main


class TaskApiTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.previous = main.DATA_FILE
        main.DATA_FILE = Path(self.directory.name) / "tasks.json"

    def tearDown(self):
        main.DATA_FILE = self.previous
        self.directory.cleanup()

    def test_create_complete_delete_and_reload(self):
        self.assertEqual(main.list_tasks(), [])
        tasks = main.create_task(main.NewTask(title=" Read ", date="2026-10-17"))
        task_id = tasks[0]["id"]
        self.assertEqual(tasks[0]["title"], "Read")
        main.create_task(main.NewTask(title="Tomorrow", date="2026-10-18"))
        main.update_task(task_id, main.Completion(completed=True))
        self.assertTrue(main.read_tasks()[0]["completed"])
        main.delete_task(task_id)
        self.assertEqual(main.list_tasks()[0]["date"], "2026-10-18")
        main.delete_task(main.list_tasks()[0]["id"])
        self.assertEqual(main.read_tasks(), [])
        self.assertEqual(json.loads(main.DATA_FILE.read_text()), [])

    def test_import_does_not_overwrite_existing(self):
        imported = main.Task(id=1, title="old", completed=True, date="2026-10-17")
        self.assertEqual(main.import_tasks([imported])[0]["id"], 1)
        main.update_task("1", main.Completion(completed=False))
        before = main.DATA_FILE.read_text()
        with self.assertRaises(HTTPException) as error:
            main.import_tasks([imported])
        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(main.DATA_FILE.read_text(), before)

    def test_corrupt_file_is_never_replaced(self):
        main.DATA_FILE.write_text("{broken", encoding="utf-8")
        with self.assertRaises(HTTPException):
            main.create_task(main.NewTask(title="new", date="2026-10-17"))
        self.assertEqual(main.DATA_FILE.read_text(), "{broken")

    def test_invalid_input_and_missing_task(self):
        for title, day in [("  ", "2026-10-17"), ("test", "2026-02-30")]:
            with self.assertRaises(ValidationError):
                main.NewTask(title=title, date=day)
        with self.assertRaises(HTTPException) as error:
            main.delete_task("missing")
        self.assertEqual(error.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
