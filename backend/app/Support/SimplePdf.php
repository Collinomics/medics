<?php
namespace App\Support;
class SimplePdf {
 public static function make(array $lines):string {
  $y=790;$content="BT /F1 12 Tf 50 $y Td ";
  foreach($lines as $i=>$line){$safe=str_replace(['\\','(',')'],['\\\\','\\(','\\)'],$line);$content.=($i?'0 -20 Td ':'')."($safe) Tj ";}$content.='ET';
  $objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>","<< /Length ".strlen($content)." >>\nstream\n$content\nendstream","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  $pdf="%PDF-1.4\n";$offsets=[0];foreach($objects as $n=>$object){$offsets[]=strlen($pdf);$pdf.=($n+1)." 0 obj\n$object\nendobj\n";}$xref=strlen($pdf);$pdf.="xref\n0 ".(count($objects)+1)."\n0000000000 65535 f \n";foreach(array_slice($offsets,1) as $offset)$pdf.=sprintf('%010d 00000 n ', $offset)."\n";$pdf.="trailer << /Size ".(count($objects)+1)." /Root 1 0 R >>\nstartxref\n$xref\n%%EOF";return $pdf;
 }
}
