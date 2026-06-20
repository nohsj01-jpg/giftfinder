import csv

input_path = r"c:\Users\노혜정\Downloads\product_recommendation_db_v2.csv"
output_path = r"c:\Users\노혜정\Downloads\giftfinder\data\products_utf8.csv"

# 디렉토리가 없으면 생성 (data 폴더)
import os
os.makedirs(os.path.dirname(output_path), exist_ok=True)

# CP949나 EUC-KR로 읽어보고 에러나면 다른 인코딩 시도
encodings = ['cp949', 'euc-kr', 'utf-8-sig', 'utf-8']
success = False

for enc in encodings:
    try:
        with open(input_path, 'r', encoding=enc) as f:
            lines = f.readlines()
        print(f"Successfully read with {enc}. Writing to {output_path} as UTF-8...")
        
        # 헤더 출력해서 제대로 읽었는지 확인
        print("Header sample:")
        print(lines[0].strip())
        print("First row sample:")
        print(lines[1].strip())
        
        with open(output_path, 'w', encoding='utf-8', newline='') as f_out:
            f_out.writelines(lines)
            
        success = True
        break
    except Exception as e:
        print(f"Failed with {enc}: {e}")

if not success:
    print("Failed to convert file encoding.")
