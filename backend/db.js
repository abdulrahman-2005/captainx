const { verify } = require("crypto");
const mongoose = require("mongoose");
const EventEmitter = require("events").EventEmitter;
mongoose.Promise = global.Promise;
const admins = ["bodyazmy.new.2005@gmail.com", "ham7code03@gmail.com","ahmedma12w@gmail.com"];  // Add admin emails here
const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = class extends EventEmitter {
    constructor(connection_uri, options = {}) {
        super();

        this.connection_uri = connection_uri;
        this.connection_options = Object.assign(
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                autoIndex: false,
                maxPoolSize: 5,
                connectTimeoutMS: 1000000,
                family: 4,
            },
            options,
        );
        this.connection = mongoose.createConnection(
            this.connection_uri,
            this.connection_options,
        );
        this.idsForHandle = {};
        this.cache = {};
        this.pkans = {
            "1": {
                price: 32.9,
                name: "Basic Plan",
                curr: "USD",
                des: "Basic Plan",
                dur: "1 Month",
                vdocipher_foldername: "basic",
                plan: 1
            },
            "2": {
                price: 588.9,
                name: "Pro Plan",
                curr: "USD",
                des: "Pro Plan",
                dur: "3 Month",
                vdocipher_foldername: "pro",
                plan: 2
            },
            "3": {
                price: 10000,
                name: "Elite Plan",
                curr: "USD",
                des: "Elite Plan",
                dur: "12 Month",
                vdocipher_foldername: "elite",
                plan: 3
            }
        }
        this.users = require("./models/users.js")(this.connection);
        this.payments = require("./models/payments.js")(this.connection);
        this.purchases = require("./models/purchases.js")(this.connection);
        this.progress = require("./models/progress.js")(this.connection);
        this.complaints = require("./models/complaint.js")(this.connection);
        this._listenToEvents();
    }


    async getUser(email) {
        return await this.users.findById(email);
    }

    async createUser(email, token) {
        const user = await this.users
            .create({
                _id: email,
                token: token,
                username: "null",
                accountNumber: "null",
                phone: "null",
                plan: 0,
                verified: false,
                status: 0
            })
        return user;
    }

    async searchUsername(username) {
        return await this.users.findOne({ username: username });
    }

    async thisAdmin(email, token) {
        if (admins.includes(email)) {
            const data = await this.getUser(email);
            if (data && data.token === token) {
                return true;
            }
        }
        return false;
    }

    async fetchAllRequests() {
        return await this.users.find({ status: 1 });
    }


    async updateUser(email, updateQuery) {
        console.log(updateQuery)
        await this.users.findOneAndUpdate({
            _id: email
        }, updateQuery, { new: true });

    }
    async updateUserStatus(email, new_status) {
        const newstatus = Number(new_status)
        if (!isNumber(new_status)) return "this not a number"
        await this.users.UpdateOne({ _id: email }, { status: new_status });
    }

    async approveUser(email) {
        try {
            const result = await this.users.updateOne(
                { _id: email },
                { $set: { status: 2, verified: true } }
            );
            return result;
        } catch (error) {
            console.error('Error in approveUser:', error);
            throw error;
        }
    }

    async denyUser(email) {
        try {
            const result = await this.users.updateOne(
                { _id: email },
                { $set: { status: 3, verified: false } }
            );
            return result;
        } catch (error) {
            console.error('Error in denyUser:', error);
            throw error;
        }
    }
    async fetchAllRequestsByPage(page = 1) {
        let recordsPerpage = 10;
        let pageIndex = page - 1;
        let recordSkipped = pageIndex * recordsPerpage;

        try {
            console.log('Fetching requests for page:', page);
            const query = { status: { $in: [0, 1, 2] } };

            const data = await this.users.aggregate([
                { $match: query },
                {
                    $facet: {
                        data: [
                            { $skip: recordSkipped },
                            { $limit: recordsPerpage }
                        ],
                        count: [{ $count: "count" }]
                    }
                }
            ]).exec();

            console.log('Aggregation result:', data);

            const result = {
                records: data[0]?.data || [],
                count: data[0]?.count?.[0]?.count || 0,
                recordsPerpage,
                recordSkipped
            };

            console.log('Returning result:', result);
            return result;
        } catch (error) {
            console.error('Error in fetchAllRequestsByPage:', error);
            throw error;
        }
    }
    _listenToEvents() {
        this.connection.on("connected", (...args) => this.onConnected(...args));
        this.connection.on("error", (...args) => this.onError(...args));
        this.connection.on("disconnect", (...args) =>
            this.onDisconnected(...args),
        );
    }

    onConnected() {
        console.log("Mongoose Connected");
    }

    onDisconnected() { }

    onError() { }

    async createPurchaseRequest(email, plan) {
        try {
            const existingPurchase = await this.purchases.findOne({
                email,
                paid: { $ne: true }
            }).sort({ createdAt: -1 });

            if (existingPurchase && existingPurchase.status !== 3) {
                // Instead of throwing error, return an object with status
                return {
                    success: false,
                    error: "DUPLICATE_REQUEST",
                    existingPurchase
                };
            }

            // Create new purchase only if no existing unpaid purchases
            const newPurchase = await this.purchases.create({
                email,
                plan,
                status: 1, // Pending
                createdAt: new Date(),
                paid: false
            });

            return {
                success: true,
                purchase: newPurchase
            };
        } catch (error) {
            console.error('Error in createPurchaseRequest:', error);
            throw error;
        }
    }

    async getPurchaseRequests(page = 1) {
        let recordsPerpage = 10;
        let pageIndex = page - 1;
        let recordSkipped = pageIndex * recordsPerpage;

        try {
            const data = await this.purchases.aggregate([
                { $match: { status: 1 } }, // Only get pending requests (status 1)
                {
                    $facet: {
                        data: [
                            { $skip: recordSkipped },
                            { $limit: recordsPerpage }
                        ],
                        count: [{ $count: "count" }]
                    }
                }
            ]).exec();

            return {
                records: data[0]?.data || [],
                count: data[0]?.count?.[0]?.count || 0,
                recordsPerpage,
                recordSkipped
            };
        } catch (error) {
            console.error('Error in getPurchaseRequests:', error);
            throw error;
        }
    }

    async approvePurchase(email, plan) {
        try {
            // Only update if the purchase is in pending status (1)
            const result = await this.purchases.updateOne(
                { email, plan, status: 1 }, // Add status condition
                { $set: { status: 2 } }
            );

            if (result.modifiedCount > 0) {
                // Update user's plan only if purchase was actually updated
                await this.users.updateOne(
                    { _id: email },
                    { $set: { plan } }
                );
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error in approvePurchase:', error);
            throw error;
        }
    }

    async denyPurchase(email, plan) {
        try {
            // Only update if the purchase is in pending status (1)
            const result = await this.purchases.updateOne(
                { email, plan, status: 1 }, // Add status condition
                { $set: { status: 3 } }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Error in denyPurchase:', error);
            throw error;
        }
    }

    async getPurchaseRequest(email, plan) {
        try {
            return await this.purchases.findOne({
                email,
                plan,
                status: { $in: [1, 2] } // Pending or approved
            });
        } catch (error) {
            console.error('Error in getPurchaseRequest:', error);
            throw error;
        }
    }

    async updatePurchaseStatus(email, plan, status) {
        try {
            await this.purchases.updateOne(
                { email, plan },
                { $set: { status } }
            );
        } catch (error) {
            console.error('Error in updatePurchaseStatus:', error);
            throw error;
        }
    }

    async markPurchaseAsPaid(email, plan) {
        try {
            const result = await this.purchases.updateOne(
                {
                    email,
                    plan,
                    status: 2, // Only update approved purchases
                    paid: { $ne: true } // Not already paid
                },
                {
                    $set: {
                        paid: true,
                        paidAt: new Date()
                    }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Error in markPurchaseAsPaid:', error);
            throw error;
        }
    }

    async getUserByToken(token) {
        try {
            // Find user by token
            const user = await this.users.findOne({ token: token });
            return user;
        } catch (error) {
            console.error('Error in getUserByToken:', error);
            throw error;
        }
    }

    async checkUserPaymentStatus(email) {
        try {
            // Get user's current plan and payment status
            const user = await this.users.findById(email);
            if (!user) {
                return { error: "User not found" };
            }

            // Get latest purchase for current plan
            const latestPurchase = await this.purchases.findOne({
                email: email,
                plan: user.plan,
                status: 2, // Approved
                paid: true
            }).sort({ createdAt: -1 });

            return {
                currentPlan: user.plan,
                hasPaid: !!latestPurchase,
                purchaseDetails: latestPurchase
            };
        } catch (error) {
            console.error('Error in checkUserPaymentStatus:', error);
            throw error;
        }
    }

    async createComplaint(email, subject, companyname, companywebsite, profits, deposit, message) {
        try {

            //check if the user is registered and approved
            const user = await this.users.findById(email);
            if (!user) {
                return { error: "User not found" };
            }

            if (user.status !== 2) {
                return { error: "User not approved" };
            }

            const newComplaint = await this.complaints.create({
                _id: new mongoose.Types.ObjectId(),
                useremail: email,
                subject,
                companyname,
                companywebsite,
                profits,
                deposit,
                message,
                createdAt: new Date(),
                status: 1
            });
            return newComplaint;
        } catch (error) {
            console.error('Error in createComplaint:', error);
            throw error;
        }
    }

    async getComplaints(page = 1) {
        let recordsPerpage = 10;
        let pageIndex = page - 1;
        let recordSkipped = pageIndex * recordsPerpage;

        try {
            const data = await this.complaints.aggregate([
                {
                    $facet: {
                        data: [
                            { $skip: recordSkipped },
                            { $limit: recordsPerpage }
                        ],
                        count: [{ $count: "count" }]
                    }
                }
            ]).exec();

            return {
                records: data[0]?.data || [],
                count: data[0]?.count?.[0]?.count || 0,
                recordsPerpage,
                recordSkipped
            };
        } catch (error) {
            console.error('Error in getComplaints:', error);
            throw error;
        }
    }

    async hasPaidPlan(email, plan) {
        try {
            const purchase = await this.purchases.findOne({
                email,
                plan,
                status: 2, // Approved
                paid: true // Already paid
            });
            return !!purchase;
        } catch (error) {
            console.error('Error in hasPaidPlan:', error);
            throw error;
        }
    }
};
