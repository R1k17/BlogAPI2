const express = require('express');
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const { BlogPost } = require('../models');
const {runServer, app, closeServer} = require('../server');
const {DATABASE_URL} = require('../config');
const expect = chai.expect;

chai.use(chaiHttp);

function seedBlogData() {
    console.info('seeding blog data');
    const seedData = [];
    for(let i=1; i<=5; i++){
        seedData.push(generatePostData());
    }

    return BlogPost.insertMany(seedData);
}

function generatePostData() {
    return {
        author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        },
        title: faker.lorem.sentence(),
        content: faker.lorem.text()
    }
}

function tearDownDb(){
        console.warn('Deleting database');
        return mongoose.connection.dropDatabase();
}

describe('/posts', function(){
    before(function(){
        return runServer(DATABASE_URL);
    })
    
    beforeEach(function() {
        return seedBlogData();
    })

    afterEach(function() {
        return tearDownDb();
    })

    after(function(){
        return closeServer();
    })
    
    describe('GET', function(){
        it('return a set of posts', function(){
            let res;
            return chai.request(app)
            .get('/posts')
            .then(function(_res){
                res = _res;
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                // expect(res.body).to.have.lengthOf(1);
                res.body.forEach(function(item){
                    expect(item).to.be.a('object');
                });
            })
        });

    });

    describe('POST', function(){
        it('add a blog post', function(){
            const newPost = generatePostData();

            return chai.request(app)
            .post('/posts')
            .send(newPost)
            .then(function(res){
                expect(res).to.have.status(201);
                expect(res).to.be.json;
                expect(res.body).to.be.a('object');
                expect(res.body).to.include.keys(
                    'id', 'title', 'content', 'author', 'created');
                expect(res.body.title).to.equal(newPost.title);
                expect(res.body.author).to.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
                expect(res.body.content).to.equal(newPost.content);
                expect(res.body.id).to.not.be.null;
                return BlogPost.findById(res.body.id);
            })
            // why that part, what does it do?
            .then(function (post) {
                expect(post.title).to.equal(newPost.title);
                expect(post.content).to.equal(newPost.content);
                expect(post.author.firstName).to.equal(newPost.author.firstName);
                expect(post.author.lastName).to.equal(newPost.author.lastName);
            });
        });
    });

    describe('PUT', function() {
        it('update a post', function() {
            // create an object with the data I want to update
            const updateData = {
                title: 'lorem ipsum',
                author: {
                    firstName: 'Harry',
                    lastName: 'Roberts'
                },
                content: 'A lot of lorem ipsum'
            };
            return BlogPost
            // retrieve existing post
            .findOne()
            .then(function(post) {
                // set the id on updateData
                updateData.id = post.id;
                return chai.request(app)
                .put(`/posts/${post.id}`)
                .send(updateData);
            })
            .then(function(res) {
                expect(res).to.have.status(204);
                return BlogPost.findById(updateData.id);
            })
            .then(function(post) {
                expect(post.title).to.equal(updateData.title);
                expect(post.content).to.equal(updateData.content);
                expect(post.author.firstName).to.equal(updateData.author.firstName);
                expect(post.author.lastName).to.equal(updateData.author.lastName);
            });
        });
    });

    describe('DELETE', function() {
        it('should delete specific post', function() {
            let post
            return BlogPost
            // find post of existing post
            .findOne()
            then(function(_post) {
                post = _post;
                // delete existing post
                return chai.request(app).delete(`/posts/${post.id}`);
            })
            .then(function(res) {
                expect(res).to.have.status(204);
                return BlogPost.findById(post.id);
            })
            // test if post is not contained in db anymore
            .then(function(_post) {
                expect(_post).to.be.null;
            });
        });
    });
});
