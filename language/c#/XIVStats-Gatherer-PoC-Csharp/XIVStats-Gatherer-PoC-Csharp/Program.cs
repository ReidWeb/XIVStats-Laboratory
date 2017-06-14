using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection.PortableExecutable;
using System.Threading.Tasks;
using HtmlAgilityPack;

namespace XIVStats_Gatherer_PoC_Csharp
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello World!");

	        var tasks = new List<Task>();

	        for (int i = 0; i < 100; i++)
	        {
		        tasks.Add(ProcessCharacter(i));
	        }
	 
	        Task.WaitAll(tasks.ToArray());
	        
	        
	        Console.WriteLine("Done");

        }


	    private static async Task ProcessCharacter(int id)
	    {
		    try
		    {
			    var client = new HttpClient();
			    client.DefaultRequestHeaders.Add("User-Agent", "FFXIV Census Gatherer Prototype");

			    var url = "http://eu.finalfantasyxiv.com/lodestone/character/" + id;

			    HttpResponseMessage result = await client.GetAsync(url);

			    if (result.StatusCode == System.Net.HttpStatusCode.OK)
			    {
	
					Stream stream = await result.Content.ReadAsStreamAsync(); 
	 
					HtmlDocument doc = new HtmlDocument(); 
	 
					doc.Load(stream); 
					
					
					HtmlNode title = doc.DocumentNode.SelectSingleNode("//head/title");
					Console.WriteLine(id + ", " + title.InnerText.Split('|')[0]);
				    
			    }
			    
		    } 
		    catch (HttpRequestException exception)
		    {
			    Console.WriteLine(exception.Message);
			    if (exception.Message.Contains("429"))
			    {
				    ProcessCharacter(id).Wait();
			    }
		    }
	    }
    }

}
