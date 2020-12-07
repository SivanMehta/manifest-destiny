for file in texts/*.txt
do
  echo aws s3 cp \"$file\" s3://matthews-digest "&&" >> do.sh
done
