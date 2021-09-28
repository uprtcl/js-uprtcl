# Adding patterns to our Local App

As you saw in our first app example, it is the responsibility of the client application to create the app structure and indexing the objects it create in order to them to show correctly using the searchEngine API.

This is quite boring and error prone. For this reason, and others that will be clear later, we specify Patterns in our application.

A pattern is a typescript class that has recognize function inside of it, and to which a set of Behaviors are associated. It is assumed that, if the recognize function return true for a given object, then the behaviors associated to that pattern can be assocuated to that object too.

In our example, we will create 3 patterns, for the 3 types of objects we support

App
Thougts
Tags

And we will define the children, the linksTo and the text behaviors for each of them.

Now, we only need to register the pattern in the evees service and it will take care of extracting the indexing information to be sent to the remote.

Our thoughts app will then looks like this:
