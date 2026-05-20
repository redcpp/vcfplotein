# Deploy script: expects DEPLOY_HOST (e.g. user@server) to be set in the environment
: "${DEPLOY_HOST:?set DEPLOY_HOST, e.g. user@server}"

echo 'Deleting static plotein from server'
ssh $DEPLOY_HOST 'rm -r /var/www/html/*'

echo 'Uploading static plotein to server'
scp -r dist/* $DEPLOY_HOST:/var/www/html
