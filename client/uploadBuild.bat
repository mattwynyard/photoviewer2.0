ssh root@178.128.189.52 rm -r /var/www/osmium.nz/build
scp -r ./build root@178.128.189.52:/var/www/osmium.nz/
pause