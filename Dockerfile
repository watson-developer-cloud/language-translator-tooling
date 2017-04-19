# This Dockerfile is used to build an image containing basic stuff to be used as a Jenkins slave build node. 
FROM ubuntu:trusty 
MAINTAINER Tom Canova <tom.canova@us.ibm.com> 

USER root

# Make sure the package repository is up to date. 
RUN rm -rvf /var/lib/apt/lists/* && apt-get update
RUN apt-get -y upgrade

# Install a basic SSH server 
RUN apt-get install -y openssh-server wget curl python git git-core make build-essential g++ jq maven screen curl make openjdk-7-jdk unzip
RUN sed -i 's|session    required     pam_loginuid.so|session    optional     pam_loginuid.so|g' /etc/pam.d/sshd
RUN mkdir -p /var/run/sshd

# Add user ibmadmin to the image 
RUN adduser --quiet --uid 1000 ibmadmin

# Set password for the ibmadmin user
RUN echo "ibmadmin:ibmadmin" | chpasswd

# Standard SSH port 
EXPOSE 22 
CMD ["/usr/sbin/sshd", "-D"]

# Install python modules
RUN apt-get update && apt-get install -y python-setuptools
RUN easy_install junit_xml

# Install Node
RUN cd /opt && wget https://nodejs.org/dist/v4.2.4/node-v4.2.4-linux-x64.tar.gz && tar zxvf node-v4.2.4-linux-x64.tar.gz && mv node-v4.2.4-linux-x64 node

ENV PATH /opt/node/bin:$PATH

RUN export USER=root && npm install npm@2.13.5 -g  && npm install -g mocha istanbul babel gulp gulp-cli http-server esdoc jspm bower node-inspector nodemon chai mocha-junit-reporter grunt-cli yo jasmine

RUN chown -R ibmadmin:ibmadmin /home/ibmadmin

RUN echo 'export PATH=$PATH:/opt/node/bin' >/etc/profile.d/node.sh

RUN wget "https://cli.run.pivotal.io/stable?release=debian64&source=github" -O cf-cli_amd64.deb && dpkg -i cf-cli_amd64.deb

WORKDIR /usr/local/bin

RUN wget https://ucdeploy-watson-blue.swg-devops.com/tools/udclient.zip -O udclient.zip && unzip udclient.zip

USER ibmadmin

ENV PATH /opt/node/bin:$PATH

RUN git config --global url."https://".insteadOf git://

USER root
