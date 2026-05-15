import re
p = 'b:/GOLD/indx.html'
with open(p, 'r', encoding='utf-8') as f:
    s = f.read()
s2 = re.sub(
    r'// ===== LEGACY LIGHTWEIGHT CHARTS CODE.*?// ===== END LEGACY CHART CODE =====',
    '// (Legacy Lightweight Charts code removed - replaced by TradingView widget above)',
    s, flags=re.DOTALL)
with open(p, 'w', encoding='utf-8', newline='') as f:
    f.write(s2)
print('original_len=%d new_len=%d removed=%d' % (len(s), len(s2), len(s) - len(s2)))
