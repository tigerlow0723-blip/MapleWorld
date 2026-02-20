import csv
import os

def process_mask(col1, col2, col3):
    rows = [col1, col2, col3]
    # Filter rows that have '1'
    filtered_rows = [r for r in rows if r and '1' in r]
    if not filtered_rows:
        return '1'
    # Find min and max index of '1' across all valid rows
    min_idx = min([r.find('1') for r in filtered_rows if '1' in r])
    max_idx = max([r.rfind('1') for r in filtered_rows if '1' in r])
    
    # slice the rows
    sliced_rows = [r[min_idx:max_idx+1] for r in filtered_rows]
    return '/'.join(sliced_rows)

def process_equip_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    lines = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        # Assuming the last 3 columns are 1, 2, 3
        if header[-1] == '3' and header[-2] == '2' and header[-3] == '1':
            new_header = header[:-3] + ['shapeMask']
            lines.append(new_header)
            for row in reader:
                if len(row) >= 3:
                    c1, c2, c3 = row[-3], row[-2], row[-1]
                    mask = process_mask(c1, c2, c3)
                    lines.append(row[:-3] + [mask])
                else:
                    lines.append(row)
        else:
            print(f"Header does not end with 1,2,3 for {filepath}")
            return
            
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(lines)
    print(f"Processed {filepath}")

def process_other_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
        
    lines = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        if 'shapeMask' in header:
            print(f"Already processed {filepath}")
            return
            
        new_header = header + ['shapeMask']
        lines.append(new_header)
        for row in reader:
            if row: # not empty
                lines.append(row + ['1'])
                
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(lines)
    print(f"Processed {filepath}")

base_path = r'c:\Users\Hong\Desktop\Mapleworld\Lucky_Backpack\RootDesk\MyDesk'
equip = os.path.join(base_path, 'Data_Table - 아이템 - 장비.csv')
consum = os.path.join(base_path, 'Data_Table - 소비 - 소비.csv')
etc = os.path.join(base_path, 'Data_Table - 기타 - 기타.csv')

process_equip_file(equip)
process_other_file(consum)
process_other_file(etc)
