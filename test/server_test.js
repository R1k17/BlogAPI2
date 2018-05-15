const express = require('express');
const chai = require('chai');
const chaiHttp = require('chai-http');
const {runServer, app, closeServer} = require('../server');
const {DATABASE_URL} = require('../config');

chai.use(chaiHttp);



describe('/posts', function(){
    before(function(){
        runServer(DATABASE_URL);
    })
    after(function(){
        closeServer();
    })
    
    describe('GET', function(){
        it('return a set of posts', function(){
            return chai.request(app)
            .get('/posts')
            .then(function(res){
                chai.expect(res).to.have.status(200);
            })
        })

    })
})

