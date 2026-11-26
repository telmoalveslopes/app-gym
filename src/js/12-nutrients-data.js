const NU=`kcal|Calorias|Calories|kcal|m|e
p|Proteína|Protein|g|m|e
c|Hidratos de carbono|Carbs|g|m|e
f|Gordura|Fat|g|m|e
fib|Fibra|Fiber|g|m|c
sug|Açúcares|Sugars|g|x|c
sat|Gordura saturada|Saturated fat|g|x|g
chol|Colesterol|Cholesterol|mg|x|g
na|Sódio|Sodium|mg|x|m
a|Vitamina A|Vitamin A|µg|m|v
vc|Vitamina C|Vitamin C|mg|m|v
d|Vitamina D|Vitamin D|µg|m|v
e|Vitamina E|Vitamin E|mg|m|v
k|Vitamina K|Vitamin K|µg|m|v
b1|Vitamina B1 (tiamina)|Vitamin B1 (thiamin)|mg|m|v
b2|Vitamina B2 (riboflavina)|Vitamin B2 (riboflavin)|mg|m|v
b3|Vitamina B3 (niacina)|Vitamin B3 (niacin)|mg|m|v
b6|Vitamina B6|Vitamin B6|mg|m|v
b9|Folato (B9)|Folate (B9)|µg|m|v
b12|Vitamina B12|Vitamin B12|µg|m|v
ca|Cálcio|Calcium|mg|m|m
fe|Ferro|Iron|mg|m|m
mg|Magnésio|Magnesium|mg|m|m
ph|Fósforo|Phosphorus|mg|m|m
kp|Potássio|Potassium|mg|m|m
zn|Zinco|Zinc|mg|m|m
se|Selénio|Selenium|µg|m|m
mono|Gordura monoinsaturada|Monounsaturated fat|g|m|g
poly|Gordura polinsaturada|Polyunsaturated fat|g|m|g
trans|Gordura trans|Trans fat|g|x|g
o3|Ómega-3|Omega-3|g|m|g
o6|Ómega-6|Omega-6|g|m|g
water|Água|Water|ml|m|o
alc|Álcool|Alcohol|g|x|o
caf|Cafeína|Caffeine|mg|x|o
b5|Vitamina B5 (ácido pantoténico)|Vitamin B5 (pantothenic acid)|mg|m|v
cho|Colina|Choline|mg|m|o
cu|Cobre|Copper|mg|m|m
mn|Manganês|Manganese|mg|m|m
io|Iodo|Iodine|µg|m|m
his|Histidina|Histidine|g|m|a
ile|Isoleucina|Isoleucine|g|m|a
leu|Leucina|Leucine|g|m|a
lys|Lisina|Lysine|g|m|a
met|Metionina + cisteína|Methionine + cysteine|g|m|a
phe|Fenilalanina + tirosina|Phenylalanine + tyrosine|g|m|a
thr|Treonina|Threonine|g|m|a
trp|Triptofano|Tryptophan|g|m|a
val|Valina|Valine|g|m|a
sfib|Fibra solúvel|Soluble fiber|g|m|c|e
ifib|Fibra insolúvel|Insoluble fiber|g|m|c|e
addsug|Açúcares adicionados|Added sugars|g|x|c|e
starch|Amido|Starch|g|m|c|e
lact|Lactose|Lactose|g|m|c|e
ala|Ácido alfa-linolénico (ALA)|Alpha-linolenic acid (ALA)|g|m|g|e
epa|EPA|EPA|g|m|g|e
dha|DHA|DHA|g|m|g|e
la|Ácido linoleico (LA)|Linoleic acid (LA)|g|m|g|e
ret|Retinol|Retinol|mcg|m|v|e
bcar|Beta-caroteno|Beta-carotene|mcg|m|v|e
acar|Alfa-caroteno|Alpha-carotene|mcg|m|v|e
lyc|Licopeno|Lycopene|mcg|m|v|e
lut|Luteína + zeaxantina|Lutein + zeaxanthin|mcg|m|v|e
d2|Vitamina D2|Vitamin D2|mcg|m|v|e
d3|Vitamina D3|Vitamin D3|mcg|m|v|e
k1|Vitamina K1|Vitamin K1|mcg|m|v|e
k2|Vitamina K2|Vitamin K2|mcg|m|v|e
b7|Vitamina B7 (biotina)|Vitamin B7 (biotin)|mcg|m|v|n
cl|Cloreto|Chloride|mg|m|m|e
fl|Flúor|Fluoride|mcg|m|m|e
cr|Crómio|Chromium|mcg|m|m|e
mo|Molibdénio|Molybdenum|mcg|m|m|e
cys|Cistina|Cystine|g|m|a|e
tyr|Tirosina|Tyrosine|g|m|a|e
ala2|Alanina|Alanine|g|m|a|e
arg|Arginina|Arginine|g|m|a|e
asp|Ácido aspártico|Aspartic acid|g|m|a|e
glu|Ácido glutâmico|Glutamic acid|g|m|a|e
gly|Glicina|Glycine|g|m|a|e
pro|Prolina|Proline|g|m|a|e
ser|Serina|Serine|g|m|a|e`.split('\n').map(r=>{const a=r.split('|');return[a[0],a[1],a[2],a[3]=='mcg'?'\u00b5g':a[3],0,a[4],a[5],a[6]||'m']});NU.forEach((n,i)=>{if(i>=40&&i<=48)n[7]='e'});
