"""ساخت متن توضیحات یوتیوب همراه با فصل‌بندی (Chapters) از روی خط زمان."""
import json
from pathlib import Path

DIR = Path(__file__).parent
tl = json.loads((DIR / "out" / "timeline.json").read_text())
FA = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


def ts(sec):
    sec = int(sec)
    return f"{sec // 60}:{sec % 60:02d}"


lines = []
for s in tl["scenes"]:
    if s["type"] == "intro":
        lines.append(f"0:00 آغاز")
    elif s["type"] == "era":
        lines.append(f"{ts(s['start'])} {s['title']} — {s['date']}")
    elif s["type"] == "outro":
        lines.append(f"{ts(s['start'])} پایان")

total = tl["total"]
text = f"""# عنوان پیشنهادی
تاریخ کامل ایران در {str(int(total // 60)).translate(FA)} دقیقه | از ایلام و هخامنشیان تا امروز (موشن گرافیک)

# توضیحات
سفری تصویری در بیش از ۵۰۰۰ سال تاریخ ایران؛ از شهر سوخته و تمدن ایلام تا ماد، هخامنشیان، اشکانیان و ساسانیان، ورود اسلام، سلسله‌های ایرانی، سلجوقیان، مغول و تیموریان، صفویه، افشاریه، زندیه، قاجار، پهلوی و ایران امروز.
در این ویدیو گسترهٔ تقریبی قلمرو هر دوره روی نقشه نمایش داده می‌شود.

⏱ فصل‌ها:
""" + "\n".join(lines) + """

📌 توجه: مرزهای نشان‌داده‌شده تقریبی‌اند و برای درک کلی گسترهٔ هر دوره کشیده شده‌اند.

اگر این ویدیو را دوست داشتید، لایک و سابسکرایب کنید و نظرتان را بنویسید.

# برچسب‌ها
تاریخ ایران, ایران باستان, هخامنشیان, کوروش بزرگ, ساسانیان, اشکانیان, صفویه, قاجار, پهلوی, تاریخ, موشن گرافیک, History of Iran, Persian Empire, Iran history animated
"""
(DIR / "dist").mkdir(exist_ok=True)
(DIR / "dist" / "youtube.md").write_text(text)
print(text)
