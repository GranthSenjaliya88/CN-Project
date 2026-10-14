"""Generate the README's illustrative delayed-ACK timeline (Pillow required)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).parent / 'screenshots' / 'delayed-ack.gif'
def font(size):
    for name in ('C:/Windows/Fonts/segoeui.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if Path(name).exists():
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()

frames = []
for step in range(90):
    t = min(1700, step * 25)
    im = Image.new('RGB', (1000, 410), '#07101e')
    d = ImageDraw.Draw(im)
    d.text((35, 23), 'NETVISTA / RELIABILITY IN MOTION', font=font(27), fill='#46dced')
    d.text((35, 65), 'Stop-and-Wait ARQ  |  Delayed ACK  |  Illustrative event timeline', font=font(16), fill='#a5bad0')
    for x, title, color in ((65, 'SENDER', '#60a5fa'), (765, 'RECEIVER', '#4ade80')):
        d.rounded_rectangle((x, 110, x+170, 245), radius=14, fill='#12243b', outline=color, width=2)
        d.rounded_rectangle((x+25, 135, x+145, 205), radius=5, outline=color, width=3)
        d.line((x+85, 205, x+85, 220), fill=color, width=4)
        d.line((x+60, 220, x+110, 220), fill=color, width=4)
        d.text((x+30, 255), title, font=font(19), fill=color)
    d.line((240, 155, 760, 155), fill='#254463', width=2)
    d.line((240, 215, 760, 215), fill='#234c43', width=2)
    d.text((455, 122), 'DATA 0 →', font=font(17), fill='#60a5fa')
    d.text((455, 235), '← ACK 0', font=font(17), fill='#4ade80')
    for start, end, ack, retry in ((0,100,False,False),(600,700,False,True),(1000,1100,True,False),(1600,1700,True,False)):
        if start <= t < end:
            p = (t-start)/(end-start)
            x = 755-510*p if ack else 245+510*p
            y = 215 if ack else 155
            color = '#4ade80' if ack else '#fb923c' if retry else '#60a5fa'
            d.rounded_rectangle((x-20,y-12,x+20,y+12),radius=4,fill=color)
    status = ('Sending DATA 0' if t<100 else 'Payload delivered once; receiver waits before sending ACK' if t<600 else '600 ms: timeout — retransmitting the same DATA 0' if t<700 else '700 ms: duplicate discarded; payload still delivered only once' if t<1000 else 'ACK 0 returns to the sender' if t<1100 else '1100 ms: ACK accepted — transfer complete' if t<1600 else 'Duplicate-triggered ACK returns; late ACK is ignored')
    d.text((35, 300), status, font=font(20), fill='#e5edf6')
    d.text((35, 350), f'{t:4d} ms    /    Retries: {int(t>=600)}    /    Duplicates: {int(t>=700)}    /    Delivered: {int(t>=100)}',font=font(18),fill='#46dced')
    d.rounded_rectangle((35,389,965,395),radius=3,fill='#1d3047')
    if t: d.rounded_rectangle((35,389,35+int(930*t/1700),395),radius=3,fill='#22b8cf')
    frames.append(im)
frames[0].save(OUT, save_all=True, append_images=frames[1:], duration=70, loop=0, optimize=True)
print(OUT)
